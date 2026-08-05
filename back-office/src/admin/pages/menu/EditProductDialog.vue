<template>
  <AdminDialog
    :model-value="open"
    max-width="448"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="edit-dialog">
      <v-card-title>Редактировать товар</v-card-title>
      <v-card-text>Категория: «{{ categoryName }}»</v-card-text>
      <v-card-text class="edit-dialog-fields">
        <label :for="nameId">Название товара</label>
        <AdminTextField
          :id="nameId"
          ref="nameInput"
          v-model="name"
          :aria-describedby="nameError ? nameErrorId : undefined"
          :aria-invalid="Boolean(nameError)"
          autofocus
          class="edit-dialog-input"
          type="text"
          @update:model-value="dismissFieldError('name')"
        />
        <p
          v-if="nameError"
          :id="nameErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ nameError }}
        </p>
        <label :for="categoryId">Категория</label>
        <AdminSelect
          :id="categoryId"
          v-model="categoryIdValue"
          :aria-describedby="categoryError ? categoryErrorId : undefined"
          :aria-invalid="Boolean(categoryError)"
          class="edit-dialog-input"
          @update:model-value="dismissFieldError('categoryId')"
        >
          <option
            v-for="category in props.categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </AdminSelect>
        <p
          v-if="categoryError"
          :id="categoryErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ categoryError }}
        </p>
        <label :for="typeId">Тип товара</label>
        <AdminSelect
          :id="typeId"
          v-model="type"
          :aria-describedby="typeError ? typeErrorId : undefined"
          :aria-invalid="Boolean(typeError)"
          class="edit-dialog-input"
          @update:model-value="dismissFieldError('type')"
        >
          <option
            v-for="option in PRODUCT_TYPE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </AdminSelect>
        <p
          v-if="typeError"
          :id="typeErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ typeError }}
        </p>
        <label :for="descriptionId">Описание</label>
        <AdminTextField
          :id="descriptionId"
          v-model="description"
          :aria-describedby="descriptionError ? descriptionErrorId : undefined"
          :aria-invalid="Boolean(descriptionError)"
          class="edit-dialog-input"
          type="text"
          @update:model-value="dismissFieldError('description')"
        />
        <p
          v-if="descriptionError"
          :id="descriptionErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ descriptionError }}
        </p>
        <div class="edit-dialog-toggle">
          <strong :id="activeLabelId">Товар активен</strong
          ><AdminToggle
            :model-value="isActive"
            :aria-describedby="activeError ? activeErrorId : undefined"
            :aria-invalid="Boolean(activeError)"
            :aria-labelledby="activeLabelId"
            @update:model-value="updateIsActive"
          />
        </div>
        <p
          v-if="activeError"
          :id="activeErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ activeError }}
        </p>
        <div class="edit-dialog-toggle">
          <strong :id="availableLabelId">Товар доступен</strong
          ><AdminToggle
            :model-value="isAvailable"
            :aria-describedby="availableError ? availableErrorId : undefined"
            :aria-invalid="Boolean(availableError)"
            :aria-labelledby="availableLabelId"
            @update:model-value="updateIsAvailable"
          />
        </div>
        <p
          v-if="availableError"
          :id="availableErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ availableError }}
        </p>
        <template v-if="type === 'DRINK'">
          <label>Размеры и цены, коп.</label>
          <div
            v-for="(variant, index) in variants"
            :key="variant.size"
            class="size-row"
          >
            <div class="size-row-heading">
              <span>{{ variant.size }}</span>
              <strong :id="`edit-product-size-${variant.size}`"
                >Использовать размер {{ variant.size }}</strong
              >
              <AdminToggle
                :model-value="variant.isConfigured"
                :aria-labelledby="`edit-product-size-${variant.size}`"
                :disabled="
                  variant.isConfigured && configuredVariants.length === 1
                "
                @update:model-value="
                  updateVariant(index, 'isConfigured', Boolean($event))
                "
              />
            </div>
            <div v-if="variant.isConfigured" class="size-row-fields">
              <label :for="`edit-product-price-${variant.size}`"
                >Цена, коп.</label
              >
              <AdminTextField
                :id="`edit-product-price-${variant.size}`"
                :aria-label="`Цена ${variant.size}, коп.`"
                :aria-describedby="variantsError ? variantsErrorId : undefined"
                :aria-invalid="Boolean(variantsError)"
                :value="variant.priceMinor"
                class="edit-dialog-input"
                inputmode="numeric"
                min="0"
                type="number"
                @input="
                  updateVariant(
                    index,
                    'priceMinor',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
              <strong>Доступен</strong>
              <AdminToggle
                :model-value="variant.isAvailable"
                :aria-label="`Размер ${variant.size} доступен`"
                :aria-describedby="variantsError ? variantsErrorId : undefined"
                :aria-invalid="Boolean(variantsError)"
                @update:model-value="
                  updateVariant(index, 'isAvailable', Boolean($event))
                "
              />
            </div>
            <div v-if="variant.isConfigured" class="size-row-order">
              <span>Порядок</span>
              <AdminButton
                :aria-label="`Поднять размер ${variant.size}`"
                :disabled="configuredVariantIndex(index) === 0"
                class="size-order-button"
                type="button"
                variant="secondary"
                @click="moveConfiguredVariant(index, -1)"
                >↑</AdminButton
              >
              <AdminButton
                :aria-label="`Опустить размер ${variant.size}`"
                :disabled="
                  configuredVariantIndex(index) ===
                  configuredVariants.length - 1
                "
                class="size-order-button"
                type="button"
                variant="secondary"
                @click="moveConfiguredVariant(index, 1)"
                >↓</AdminButton
              >
            </div>
          </div>
          <p
            v-if="variantsError"
            :id="variantsErrorId"
            class="edit-dialog-error"
            role="alert"
          >
            {{ variantsError }}
          </p>
        </template>
        <template v-else>
          <label :for="priceId">Цена, коп.</label>
          <AdminTextField
            :id="priceId"
            v-model="priceMinor"
            :aria-describedby="priceError ? priceErrorId : undefined"
            :aria-invalid="Boolean(priceError)"
            class="edit-dialog-input"
            inputmode="numeric"
            min="0"
            type="number"
            @update:model-value="dismissFieldError('priceMinor')"
          />
          <p
            v-if="priceError"
            :id="priceErrorId"
            class="edit-dialog-error"
            role="alert"
          >
            {{ priceError }}
          </p>
        </template>
      </v-card-text>
      <v-card-actions
        class="edit-dialog-actions admin-dialog-actions admin-dialog-actions--with-destructive"
      >
        <AdminButton
          :disabled="props.disabled || !isValid"
          type="button"
          @click="save"
          >Сохранить изменения</AdminButton
        >
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="destructive"
          @click="openDeleteConfirmation"
          >Удалить товар</AdminButton
        >
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="closeAsCancelled"
          >Отмена</AdminButton
        >
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
import ConfirmDialog from "../../shared/ui/confirm-dialog/ConfirmDialog.vue";
import { PRODUCT_TYPE_OPTIONS } from "./AddProductDialog.constants";
import { createEditProductVariantDrafts } from "./EditProductDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  ProductFormData,
  ProductFormField,
  ProductVariantDraft,
  ProductVariantMoveDirection,
} from "./AddProductDialog.types";
import type {
  EditProductDialogEmits,
  EditProductDialogProps,
} from "./EditProductDialog.types";

const props = withDefaults(defineProps<EditProductDialogProps>(), {
  fieldErrors: () => ({}),
});
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<EditProductDialogEmits>();
const categoryIdValue = shallowRef("");
const type = shallowRef<"DRINK" | "OTHER">("OTHER");
const name = shallowRef("");
const description = shallowRef("");
const priceMinor = shallowRef("");
const isActive = shallowRef(true);
const isAvailable = shallowRef(true);
const dismissedFieldErrors = shallowRef<
  Partial<Record<ProductFormField, true>>
>({});
const variants = shallowRef<ProductVariantDraft[]>(
  createEditProductVariantDrafts(null),
);
const deleteOpen = shallowRef(false);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const nameId = `edit-product-name-${useId()}`;
const categoryId = `edit-product-category-${useId()}`;
const typeId = `edit-product-type-${useId()}`;
const descriptionId = `edit-product-description-${useId()}`;
const priceId = `edit-product-price-${useId()}`;
const activeLabelId = `edit-product-active-${useId()}`;
const availableLabelId = `edit-product-available-${useId()}`;
const categoryErrorId = `edit-product-category-error-${useId()}`;
const nameErrorId = `edit-product-name-error-${useId()}`;
const typeErrorId = `edit-product-type-error-${useId()}`;
const descriptionErrorId = `edit-product-description-error-${useId()}`;
const priceErrorId = `edit-product-price-error-${useId()}`;
const variantsErrorId = `edit-product-variants-error-${useId()}`;
const activeErrorId = `edit-product-active-error-${useId()}`;
const availableErrorId = `edit-product-available-error-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const categoryName = computed(
  () =>
    props.categories.find((category) => category.id === categoryIdValue.value)
      ?.name ?? "",
);
const categoryError = computed(() =>
  categoryIdValue.value ? fieldError("categoryId") : "Выберите категорию",
);
const typeError = computed(() => fieldError("type"));
const nameError = computed(() =>
  name.value.trim() ? fieldError("name") : "Введите название товара",
);
const descriptionError = computed(() => fieldError("description"));
const priceError = computed(() =>
  isNonNegativeInteger(priceMinor.value)
    ? fieldError("priceMinor")
    : "Укажите цену в копейках",
);
const activeError = computed(() => fieldError("isActive"));
const availableError = computed(() => fieldError("isAvailable"));
const configuredVariants = computed(() =>
  variants.value.filter((variant) => variant.isConfigured),
);
const variantsError = computed(() => {
  if (configuredVariants.value.length === 0)
    return "Выберите хотя бы один размер";
  if (
    configuredVariants.value.some(
      (variant) => !isNonNegativeInteger(variant.priceMinor),
    )
  )
    return "Укажите цену для каждого выбранного размера";
  if (
    isActive.value &&
    !configuredVariants.value.some((variant) => variant.isAvailable)
  )
    return "Для активного товара нужен хотя бы один доступный размер";
  return fieldError("variants");
});
const isValid = computed(
  () =>
    !categoryError.value &&
    !typeError.value &&
    !nameError.value &&
    (type.value === "DRINK" ? !variantsError.value : !priceError.value),
);

function isNonNegativeInteger(value: string): boolean {
  return /^\d+$/.test(value);
}
function fieldError(field: ProductFormField): string | undefined {
  return dismissedFieldErrors.value[field]
    ? undefined
    : props.fieldErrors[field];
}
function dismissFieldError(field: ProductFormField): void {
  dismissedFieldErrors.value = { ...dismissedFieldErrors.value, [field]: true };
}
function resetDraft(): void {
  const product = props.product;
  categoryIdValue.value = product?.categoryId ?? "";
  type.value = product?.type ?? "OTHER";
  name.value = product?.name ?? "";
  description.value = product?.description ?? "";
  priceMinor.value = product?.priceMinor?.toString() ?? "";
  isActive.value = product?.isActive ?? true;
  isAvailable.value = product?.isAvailable ?? true;
  variants.value = createEditProductVariantDrafts(product);
  dismissedFieldErrors.value = {};
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
function updateVariant(
  index: number,
  field: "priceMinor" | "isConfigured" | "isAvailable",
  value: string | boolean,
): void {
  dismissFieldError("variants");
  if (field === "isConfigured") {
    const selected = { ...variants.value[index], isConfigured: Boolean(value) };
    const remaining = variants.value.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    const configured = remaining.filter((variant) => variant.isConfigured);
    const unconfigured = remaining.filter((variant) => !variant.isConfigured);
    variants.value = selected.isConfigured
      ? [...configured, selected, ...unconfigured]
      : [...configured, ...unconfigured, selected];
    return;
  }
  variants.value = variants.value.map((variant, currentIndex) =>
    currentIndex === index ? { ...variant, [field]: value } : variant,
  );
}
function configuredVariantIndex(index: number): number {
  return configuredVariants.value.findIndex(
    (variant) => variant === variants.value[index],
  );
}
function moveConfiguredVariant(
  index: number,
  direction: ProductVariantMoveDirection,
): void {
  const targetIndex = index + direction;
  if (
    !variants.value[index]?.isConfigured ||
    !variants.value[targetIndex]?.isConfigured
  )
    return;
  const reordered = [...variants.value];
  [reordered[index], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[index],
  ];
  variants.value = reordered;
  dismissFieldError("variants");
}
function updateIsActive(value: boolean | null): void {
  isActive.value = Boolean(value);
  dismissFieldError("isActive");
}
function updateIsAvailable(value: boolean | null): void {
  isAvailable.value = Boolean(value);
  dismissFieldError("isAvailable");
}
function save(): void {
  if (!isValid.value) return;
  const data: ProductFormData =
    type.value === "DRINK"
      ? {
          categoryId: categoryIdValue.value,
          type: "DRINK",
          name: name.value.trim(),
          description: description.value.trim(),
          isActive: isActive.value,
          isAvailable: isAvailable.value,
          priceMinor: null,
          variants: configuredVariants.value.map((variant, sortOrder) => ({
            ...(variant.id ? { id: variant.id } : {}),
            size: variant.size,
            priceMinor: Number(variant.priceMinor),
            sortOrder,
            isAvailable: variant.isAvailable,
          })),
        }
      : {
          categoryId: categoryIdValue.value,
          type: "OTHER",
          name: name.value.trim(),
          description: description.value.trim(),
          isActive: isActive.value,
          isAvailable: isAvailable.value,
          priceMinor: Number(priceMinor.value),
          variants: [],
        };
  emit("save", data);
}
function confirmDelete(): void {
  if (props.disabled) return;
  emit("delete");
  closeDialog();
}

function openDeleteConfirmation(): void {
  if (!props.disabled) deleteOpen.value = true;
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
watch(
  () => props.fieldErrors,
  () => {
    dismissedFieldErrors.value = {};
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
.edit-dialog-toggle strong {
  font-size: var(--expressa-font-size-body-strong);
}
.edit-dialog-error {
  margin: 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
}
.size-row {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-sm);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
}
.size-row-heading,
.size-row-fields {
  display: grid;
  grid-template-columns: var(--expressa-size-option) 1fr auto;
  align-items: center;
  gap: var(--expressa-space-sm);
}
.size-row-heading span {
  display: grid;
  width: var(--expressa-size-option);
  height: var(--expressa-size-option);
  place-items: center;
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface-raised);
  font-weight: var(--expressa-font-weight-semibold);
}
.size-row-heading strong,
.size-row-fields strong {
  font-size: var(--expressa-font-size-body-strong);
}
.size-row-fields {
  grid-template-columns: auto minmax(0, 1fr) auto auto;
}
.size-row-order {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--expressa-space-sm);
  color: var(--expressa-color-text-secondary);
}
.size-order-button {
  width: calc(
    var(--expressa-size-control-min-height) + var(--expressa-space-sm)
  );
  min-width: calc(
    var(--expressa-size-control-min-height) + var(--expressa-space-sm)
  );
  min-height: calc(
    var(--expressa-size-control-min-height) + var(--expressa-space-sm)
  );
  padding: 0;
}
@media (max-width: 480px) {
  .size-row-heading {
    grid-template-columns: var(--expressa-size-option) minmax(0, 1fr);
  }
  .size-row-heading :deep(.admin-toggle) {
    grid-column: 2;
    justify-self: end;
  }
  .size-row-fields {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .size-row-fields label,
  .size-row-fields .edit-dialog-input {
    grid-column: 1 / -1;
  }
  .size-row-fields strong {
    grid-column: 1;
  }
  .size-row-fields :deep(.admin-toggle) {
    grid-column: 2;
  }
}
.edit-dialog-actions {
  padding: var(--expressa-space-lg);
}
</style>
