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
          v-model="categoryIdValue"
          :aria-describedby="categoryError ? categoryErrorId : undefined"
          :aria-invalid="Boolean(categoryError)"
          autofocus
          class="add-dialog-input"
          @update:model-value="dismissFieldError('categoryId')"
        >
          <option value="">Выберите категорию</option>
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
          class="add-dialog-error"
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
          class="add-dialog-input"
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
          class="add-dialog-error"
          role="alert"
        >
          {{ typeError }}
        </p>
        <label :for="nameId">Название товара</label>
        <AdminTextField
          :id="nameId"
          v-model="name"
          :aria-describedby="nameError ? nameErrorId : undefined"
          :aria-invalid="Boolean(nameError)"
          class="add-dialog-input"
          placeholder="Например: Капучино, Латте"
          type="text"
          @update:model-value="dismissFieldError('name')"
        />
        <p
          v-if="nameError"
          :id="nameErrorId"
          class="add-dialog-error"
          role="alert"
        >
          {{ nameError }}
        </p>
        <label :for="descriptionId">Описание</label>
        <AdminTextField
          :id="descriptionId"
          v-model="description"
          :aria-describedby="descriptionError ? descriptionErrorId : undefined"
          :aria-invalid="Boolean(descriptionError)"
          class="add-dialog-input"
          type="text"
          @update:model-value="dismissFieldError('description')"
        />
        <p
          v-if="descriptionError"
          :id="descriptionErrorId"
          class="add-dialog-error"
          role="alert"
        >
          {{ descriptionError }}
        </p>
        <div class="add-dialog-toggle">
          <strong :id="activeLabelId">Товар активен</strong>
          <AdminToggle
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
          class="add-dialog-error"
          role="alert"
        >
          {{ activeError }}
        </p>
        <div class="add-dialog-toggle">
          <strong :id="availableLabelId">Товар доступен</strong>
          <AdminToggle
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
          class="add-dialog-error"
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
              <strong :id="`add-product-size-${variant.size}`"
                >Использовать размер {{ variant.size }}</strong
              >
              <AdminToggle
                :model-value="variant.isConfigured"
                :aria-labelledby="`add-product-size-${variant.size}`"
                :disabled="
                  variant.isConfigured && configuredVariants.length === 1
                "
                @update:model-value="
                  updateVariant(index, 'isConfigured', Boolean($event))
                "
              />
            </div>
            <div v-if="variant.isConfigured" class="size-row-fields">
              <label :for="`add-product-price-${variant.size}`"
                >Цена, коп.</label
              >
              <AdminTextField
                :id="`add-product-price-${variant.size}`"
                :aria-label="`Цена ${variant.size}, коп.`"
                :aria-describedby="variantsError ? variantsErrorId : undefined"
                :aria-invalid="Boolean(variantsError)"
                :value="variant.priceMinor"
                class="add-dialog-input"
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
            class="add-dialog-error"
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
            class="add-dialog-input"
            inputmode="numeric"
            min="0"
            type="number"
            @update:model-value="dismissFieldError('priceMinor')"
          />
          <p
            v-if="priceError"
            :id="priceErrorId"
            class="add-dialog-error"
            role="alert"
          >
            {{ priceError }}
          </p>
        </template>
      </v-card-text>
      <v-card-actions class="add-dialog-actions admin-dialog-actions">
        <AdminButton
          :disabled="props.disabled || !isValid"
          type="button"
          @click="confirm"
          >Добавить товар</AdminButton
        >
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="cancel"
          >Отмена</AdminButton
        >
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
import {
  PRODUCT_TYPE_OPTIONS,
  createInitialProductVariantDrafts,
} from "./AddProductDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  AddProductDialogEmits,
  AddProductDialogProps,
  ProductFormData,
  ProductFormField,
  ProductVariantDraft,
  ProductVariantMoveDirection,
} from "./AddProductDialog.types";

const props = withDefaults(defineProps<AddProductDialogProps>(), {
  fieldErrors: () => ({}),
});
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<AddProductDialogEmits>();
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
  createInitialProductVariantDrafts(),
);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const categoryId = `add-product-category-${useId()}`;
const typeId = `add-product-type-${useId()}`;
const nameId = `add-product-name-${useId()}`;
const descriptionId = `add-product-description-${useId()}`;
const priceId = `add-product-price-${useId()}`;
const activeLabelId = `add-product-active-${useId()}`;
const availableLabelId = `add-product-available-${useId()}`;
const categoryErrorId = `add-product-category-error-${useId()}`;
const nameErrorId = `add-product-name-error-${useId()}`;
const typeErrorId = `add-product-type-error-${useId()}`;
const descriptionErrorId = `add-product-description-error-${useId()}`;
const priceErrorId = `add-product-price-error-${useId()}`;
const variantsErrorId = `add-product-variants-error-${useId()}`;
const activeErrorId = `add-product-active-error-${useId()}`;
const availableErrorId = `add-product-available-error-${useId()}`;
const categorySelect =
  useTemplateRef<InstanceType<typeof AdminSelect>>("categorySelect");
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
  categoryIdValue.value = "";
  type.value = "OTHER";
  name.value = "";
  description.value = "";
  priceMinor.value = "";
  isActive.value = true;
  isAvailable.value = true;
  variants.value = createInitialProductVariantDrafts();
  dismissedFieldErrors.value = {};
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
function confirm(): void {
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
  emit("confirm", data);
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
watch(
  () => props.fieldErrors,
  () => {
    dismissedFieldErrors.value = {};
  },
);
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
.add-dialog-toggle strong {
  font-size: var(--expressa-font-size-body-strong);
}
.add-dialog-error {
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
  .size-row-fields .add-dialog-input {
    grid-column: 1 / -1;
  }
  .size-row-fields strong {
    grid-column: 1;
  }
  .size-row-fields :deep(.admin-toggle) {
    grid-column: 2;
  }
}
.add-dialog-actions {
  padding: var(--expressa-space-lg);
}
</style>
