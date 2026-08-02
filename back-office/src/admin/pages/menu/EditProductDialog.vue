<template>
  <AdminDialog
    :aria-describedby="`edit-product-description-${nameId}`"
    :aria-labelledby="`edit-product-title-${nameId}`"
    :model-value="open"
    max-width="448"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="edit-dialog">
      <v-card-title :id="`edit-product-title-${nameId}`">
        Редактировать товар
      </v-card-title>
      <v-card-text :id="`edit-product-description-${nameId}`">
        Категория: «{{ props.product?.category ?? "" }}»
      </v-card-text>
      <v-card-text class="edit-dialog-fields">
        <label :for="nameId">Название товара</label>
        <AdminTextField
          :id="nameId"
          ref="nameInput"
          v-model="name"
          autofocus
          class="edit-dialog-input"
          placeholder="Например: Капучино, Латте"
          type="text"
        />
        <label :for="categoryId">Категория</label>
        <AdminSelect
          :id="categoryId"
          v-model="category"
          class="edit-dialog-input"
        >
          <option v-for="item in props.categories" :key="item" :value="item">
            {{ item }}
          </option>
        </AdminSelect>
        <div class="edit-dialog-toggle">
          <div>
            <strong :id="sizesLabelId">Размеры S / M / L</strong>
            <span>Включить разные размеры с отдельными ценами</span>
          </div>
          <AdminToggle v-model="hasSizes" :aria-labelledby="sizesLabelId" />
        </div>
        <template v-if="hasSizes">
          <label>Цены по размерам, ₽</label>
          <div v-for="(size, index) in sizes" :key="size.id" class="size-row">
            <span>{{ size.size }}</span>
            <AdminTextField
              :aria-label="`Цена ${size.size}`"
              :value="size.price || ''"
              class="edit-dialog-input"
              min="0"
              placeholder="Введите цену"
              step="0.01"
              type="number"
              @input="
                updateSize(index, ($event.target as HTMLInputElement).value)
              "
            />
          </div>
        </template>
        <template v-else>
          <label :for="priceId">Цена, ₽</label>
          <AdminTextField
            :id="priceId"
            v-model="price"
            class="edit-dialog-input"
            min="0"
            placeholder="Введите цену"
            step="0.01"
            type="number"
          />
        </template>
      </v-card-text>
      <v-card-actions class="edit-dialog-actions">
        <AdminButton :disabled="!isValid" type="button" @click="save">
          Сохранить изменения
        </AdminButton>
        <AdminButton
          type="button"
          variant="destructive"
          @click="deleteOpen = true"
        >
          Удалить товар
        </AdminButton>
        <AdminButton type="button" variant="ghost" @click="closeAsCancelled">
          Отмена
        </AdminButton>
      </v-card-actions>
    </v-card>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="deleteOpen"
    confirm-label="Удалить"
    confirm-variant="destructive"
    description="Товар будет удалён без возможности восстановления."
    title="Удалить товар?"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";

import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminDialog from "../../shared/ui/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../shared/ui/admin-select/AdminSelect.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../shared/ui/admin-toggle/AdminToggle.vue";
import type { EditMenuProductData } from "../../shared/ui/Admin.types";
import ConfirmDialog from "../../shared/ui/confirm-dialog/ConfirmDialog.vue";
import { createEditProductSizeDrafts } from "./EditProductDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  EditProductDialogEmits,
  EditProductDialogProps,
  ProductSizeDraft,
} from "./EditProductDialog.types";

const props = defineProps<EditProductDialogProps>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<EditProductDialogEmits>();
const name = shallowRef("");
const category = shallowRef("");
const hasSizes = shallowRef(false);
const price = shallowRef("");
const sizes = shallowRef<ProductSizeDraft[]>(createEditProductSizeDrafts(null));
const deleteOpen = shallowRef(false);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const nameId = `edit-product-name-${useId()}`;
const categoryId = `edit-product-category-${useId()}`;
const priceId = `edit-product-price-${useId()}`;
const sizesLabelId = `edit-product-sizes-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const validSizes = computed(() =>
  sizes.value
    .filter((size) => size.price > 0)
    .map(({ size, price }) => ({ size, price })),
);
const isValid = computed(() =>
  Boolean(
    name.value.trim() &&
    (hasSizes.value
      ? validSizes.value.length
      : price.value && Number(price.value) > 0),
  ),
);

function resetDraft(): void {
  const product = props.product;
  name.value = product?.name ?? "";
  category.value = product?.category ?? "";
  hasSizes.value = Boolean(product?.sizes?.length);
  price.value = product?.price?.toString() ?? "";
  sizes.value = createEditProductSizeDrafts(product);
}

function closeDialog(): void {
  deleteOpen.value = false;
  resetDraft();
  open.value = false;
  restoreFocus();
}

function closeAsCancelled(): void {
  closeDialog();
  emit("cancel");
}

function updateOpen(value: boolean): void {
  if (value) open.value = true;
  else closeAsCancelled();
}

function updateSize(index: number, value: string): void {
  sizes.value = sizes.value.map((size, currentIndex) =>
    currentIndex === index ? { ...size, price: Number(value) } : size,
  );
}

function save(): void {
  if (!isValid.value) return;
  const data: EditMenuProductData = {
    name: name.value.trim(),
    category: category.value,
  };
  if (hasSizes.value) data.sizes = validSizes.value;
  else data.price = Number(price.value);
  emit("save", data);
  closeDialog();
}

function confirmDelete(): void {
  emit("delete");
  closeDialog();
}

function focusFirstField(): void {
  nameInput.value?.$el.focus();
}

watch(
  [open, () => props.product],
  ([isOpen, product], [wasOpen, previousProduct]) => {
    if (isOpen && (!wasOpen || product !== previousProduct)) resetDraft();
    if (isOpen && !wasOpen) captureReturnFocus();
    if (!isOpen && wasOpen) {
      deleteOpen.value = false;
      resetDraft();
      restoreFocus();
    }
  },
);
</script>

<style scoped lang="scss">
.edit-dialog {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}
.edit-dialog-fields {
  display: grid;
  gap: var(--expressa-space-sm);
}
.edit-dialog-fields label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.edit-dialog-input {
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
}
.edit-dialog-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-control-inline) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.edit-dialog-toggle strong,
.edit-dialog-toggle span {
  display: block;
}
.edit-dialog-toggle strong {
  font-size: var(--expressa-font-size-body-strong);
}
.edit-dialog-toggle span {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}
.size-row {
  display: flex;
  align-items: center;
  gap: var(--expressa-space-sm);
}
.size-row span {
  display: grid;
  width: var(--expressa-size-option);
  height: var(--expressa-size-option);
  place-items: center;
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface-raised);
  font-weight: var(--expressa-font-weight-semibold);
}
.edit-dialog-actions {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-lg);
}
.edit-dialog-actions .admin-button {
  width: 100%;
}
</style>
