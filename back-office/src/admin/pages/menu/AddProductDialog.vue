<template>
  <AdminDialog
    :model-value="open"
    max-width="448"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="add-dialog">
      <v-card-title>Новый товар</v-card-title>
      <v-card-text>Добавьте новый товар в меню</v-card-text>
      <v-card-text class="add-dialog-fields">
        <label :for="categoryId">Категория</label>
        <AdminSelect
          :id="categoryId"
          ref="categorySelect"
          v-model="category"
          autofocus
          class="add-dialog-input"
        >
          <option value="">Выберите категорию</option>
          <option v-for="item in props.categories" :key="item" :value="item">
            {{ item }}
          </option>
        </AdminSelect>
        <p v-if="!props.categories.length" class="add-dialog-error">
          Сначала создайте хотя бы одну категорию
        </p>
        <label :for="nameId">Название товара</label>
        <AdminTextField
          :id="nameId"
          v-model="name"
          class="add-dialog-input"
          placeholder="Например: Капучино, Латте"
          type="text"
        />
        <div class="add-dialog-toggle">
          <div>
            <strong :id="sizesLabelId">Размеры S / M / L</strong>
            <span>Включить разные размеры с отдельными ценами</span>
          </div>
          <AdminToggle v-model="hasSizes" :aria-labelledby="sizesLabelId" />
        </div>
        <template v-if="hasSizes">
          <label>Цены по размерам, ₽</label>
          <div v-for="(item, index) in sizes" :key="item.id" class="size-row">
            <span>{{ item.size }}</span>
            <AdminTextField
              :aria-label="`Цена ${item.size}`"
              :value="item.price"
              class="add-dialog-input"
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
            class="add-dialog-input"
            min="0"
            placeholder="Введите цену"
            step="0.01"
            type="number"
          />
        </template>
      </v-card-text>
      <v-card-actions class="add-dialog-actions admin-dialog-actions">
        <AdminButton :disabled="!isValid" type="button" @click="confirm">
          Добавить товар
        </AdminButton>
        <AdminButton type="button" variant="ghost" @click="cancel">
          Отмена
        </AdminButton>
      </v-card-actions>
    </v-card>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";

import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminDialog from "../../shared/ui/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../shared/ui/admin-select/AdminSelect.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../shared/ui/admin-toggle/AdminToggle.vue";
import type { CreateMenuProductData } from "../../shared/ui/Admin.types";
import { createInitialProductSizeDrafts } from "./AddProductDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  AddProductDialogEmits,
  AddProductDialogProps,
  ProductSizeDraft,
} from "./AddProductDialog.types";

const props = defineProps<AddProductDialogProps>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<AddProductDialogEmits>();
const name = shallowRef("");
const category = shallowRef("");
const hasSizes = shallowRef(false);
const price = shallowRef("");
const sizes = shallowRef<ProductSizeDraft[]>(createInitialProductSizeDrafts());
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const categoryId = `add-product-category-${useId()}`;
const nameId = `add-product-name-${useId()}`;
const priceId = `add-product-price-${useId()}`;
const sizesLabelId = `add-product-sizes-${useId()}`;
const categorySelect =
  useTemplateRef<InstanceType<typeof AdminSelect>>("categorySelect");
const validSizes = computed(() =>
  sizes.value
    .filter((item) => item.price && parseFloat(item.price) > 0)
    .map((item) => ({ size: item.size, price: parseFloat(item.price) })),
);
const isValid = computed(() =>
  Boolean(
    name.value.trim() &&
    category.value &&
    (hasSizes.value
      ? validSizes.value.length
      : price.value && parseFloat(price.value) > 0),
  ),
);

function resetDraft(): void {
  name.value = "";
  category.value = "";
  hasSizes.value = false;
  price.value = "";
  sizes.value = createInitialProductSizeDrafts();
}

function cancel(): void {
  resetDraft();
  open.value = false;
  emit("cancel");
}

function updateOpen(value: boolean): void {
  if (value) open.value = true;
  else cancel();
}

function updateSize(index: number, value: string): void {
  sizes.value = sizes.value.map((item, current) =>
    current === index ? { ...item, price: value } : item,
  );
}

function confirm(): void {
  if (!isValid.value) return;
  const data: CreateMenuProductData = {
    name: name.value.trim(),
    category: category.value,
  };
  if (hasSizes.value) data.sizes = validSizes.value;
  else data.price = parseFloat(price.value);
  emit("confirm", data);
  resetDraft();
  open.value = false;
}

function focusFirstField(): void {
  categorySelect.value?.$el.focus();
}

watch(open, (value, previous) => {
  if (value && !previous) captureReturnFocus();
  if (!value && previous) {
    resetDraft();
    restoreFocus();
  }
});
</script>

<style scoped lang="scss">
.add-dialog {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}
.add-dialog-fields {
  display: grid;
  gap: var(--expressa-space-sm);
}
.add-dialog-fields label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.add-dialog-input {
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
.add-dialog-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-control-inline) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.add-dialog-toggle strong,
.add-dialog-toggle span {
  display: block;
}
.add-dialog-toggle strong {
  font-size: var(--expressa-font-size-body-strong);
}
.add-dialog-toggle span {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}
.add-dialog-error {
  margin: 0;
  color: var(--expressa-color-status-error);
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
.add-dialog-actions {
  padding: var(--expressa-space-lg);
}
</style>
