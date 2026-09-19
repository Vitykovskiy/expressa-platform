<template>
  <AdminDialog
    :model-value="open"
    max-width="448"
    :persistent="props.disabled"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="edit-dialog">
      <v-card-title>Редактировать товар</v-card-title>
      <section
        v-if="hasSaveOutcome"
        class="edit-dialog-outcome"
        aria-live="polite"
      >
        <p v-if="props.disabled" role="status">Сохраняем товар…</p>
        <p
          v-else-if="props.saveOutcome === 'rejected'"
          class="edit-dialog-error"
          role="alert"
        >
          Не удалось сохранить товар. Исправьте отмеченные поля и сохраните ещё
          раз.
        </p>
        <template v-else-if="props.saveOutcome === 'unconfirmed'">
          <p class="edit-dialog-error" role="alert">
            Не удалось подтвердить сохранение товара. Обновите меню и проверьте
            товар перед повторным сохранением.
          </p>
          <AdminButton
            :disabled="props.disabled"
            type="button"
            @click="emit('refresh')"
            >Обновить меню</AdminButton
          >
        </template>
        <p v-else-if="props.saveOutcome === 'saved'" role="status">
          Меню обновлено. Закройте форму и проверьте товар в меню перед
          повторным сохранением.
        </p>
        <details v-if="props.saveError" class="edit-dialog-technical-details">
          <summary>Технические сведения</summary>
          <p>{{ props.saveError.message }}</p>
          <p v-if="props.saveError.requestId">
            Идентификатор запроса: {{ props.saveError.requestId }}
          </p>
        </details>
      </section>
      <v-card-text class="edit-dialog-category"
        >Категория: «{{ categoryName }}»</v-card-text
      >
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
          :disabled="props.disabled"
          type="text"
          @blur="touch('name')"
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
          :disabled="props.disabled"
          @blur="touch('categoryId')"
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
        <label :for="descriptionId">Описание</label>
        <AdminTextField
          :id="descriptionId"
          v-model="description"
          :aria-describedby="descriptionError ? descriptionErrorId : undefined"
          :aria-invalid="Boolean(descriptionError)"
          class="edit-dialog-input"
          :disabled="props.disabled"
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
            :disabled="props.disabled"
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
            :disabled="props.disabled"
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
        <section class="edit-dialog-pricing" aria-label="Цены и порции">
          <div class="edit-dialog-pricing-heading">
            <strong>Цена и порция</strong>
            <AdminButton
              v-if="!isMultiple"
              :disabled="props.disabled"
              type="button"
              variant="secondary"
              @click="enableMultiple"
              >Несколько цен</AdminButton
            >
          </div>
          <PriceFields
            v-if="!isMultiple"
            v-model:price="price"
            v-model:portion-label="portionLabel"
            :disabled="props.disabled"
            :error="priceError"
          />
          <template v-else>
            <section
              v-for="(choice, index) in priceChoices"
              :key="choice.id ?? index"
              :aria-label="`Вариант ${index + 1}`"
              class="edit-dialog-choice"
              role="group"
            >
              <PriceFields
                :price="choice.price"
                :portion-label="choice.portionLabel"
                :disabled="props.disabled"
                :error="choiceError(index)"
                required-label
                @update:price="updateChoice(index, 'price', $event)"
                @update:portion-label="
                  updateChoice(index, 'portionLabel', $event)
                "
              />
              <div class="edit-dialog-choice-actions">
                <AdminToggle
                  :model-value="choice.isAvailable"
                  :aria-label="`Вариант ${index + 1} доступен`"
                  :disabled="props.disabled"
                  @update:model-value="
                    updateChoice(index, 'isAvailable', Boolean($event))
                  "
                />
                <AdminButton
                  :aria-label="`Поднять вариант ${index + 1}`"
                  :disabled="props.disabled || index === 0"
                  type="button"
                  variant="ghost"
                  @click="moveChoice(index, -1)"
                  >↑</AdminButton
                >
                <AdminButton
                  :aria-label="`Опустить вариант ${index + 1}`"
                  :disabled="
                    props.disabled || index === priceChoices.length - 1
                  "
                  type="button"
                  variant="ghost"
                  @click="moveChoice(index, 1)"
                  >↓</AdminButton
                >
                <AdminButton
                  :aria-label="`Удалить вариант ${index + 1}`"
                  :disabled="props.disabled"
                  type="button"
                  variant="ghost"
                  @click="removeChoice(index)"
                  >Удалить</AdminButton
                >
              </div>
            </section>
            <AdminButton
              :disabled="props.disabled"
              type="button"
              variant="secondary"
              @click="addChoice"
              >Добавить вариант</AdminButton
            >
          </template>
        </section>
      </v-card-text>
      <v-card-actions
        class="edit-dialog-actions admin-dialog-actions admin-dialog-actions--with-destructive"
      >
        <AdminButton
          :disabled="
            props.disabled ||
            !isValid ||
            props.saveOutcome === 'unconfirmed' ||
            props.saveOutcome === 'saved'
          "
          type="button"
          @click="save"
          >Сохранить изменения</AdminButton
        >
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="destructive"
          @click="openDeleteConfirmation"
          >Архивировать товар</AdminButton
        >
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="closeAsCancelled"
          >{{
            props.saveOutcome === "idle" ? "Отмена" : "Закрыть форму"
          }}</AdminButton
        >
      </v-card-actions>
    </v-card>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="deleteOpen"
    confirm-label="Архивировать"
    confirm-variant="destructive"
    description="Товар больше не будет доступен в меню."
    title="Архивировать товар?"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../../shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import { createPriceChoiceDraft } from "./AddProductDialog.constants";
import PriceFields from "./PriceFields.vue";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  ProductFormData,
  ProductFormField,
  PriceChoiceDraft,
  PriceOptionProductFormData,
} from "./AddProductDialog.types";
import type {
  EditProductDialogEmits,
  EditProductDialogProps,
} from "./EditProductDialog.types";

const props = withDefaults(defineProps<EditProductDialogProps>(), {
  fieldErrors: () => ({}),
  saveError: null,
  saveOutcome: "idle",
});
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<EditProductDialogEmits>();
const categoryIdValue = shallowRef("");
const name = shallowRef("");
const description = shallowRef("");
const price = shallowRef("");
const portionLabel = shallowRef("");
const isMultiple = shallowRef(false);
const priceChoices = shallowRef<PriceChoiceDraft[]>([]);
const isActive = shallowRef(true);
const isAvailable = shallowRef(true);
const dismissedFieldErrors = shallowRef<
  Partial<Record<ProductFormField, true>>
>({});
const touched = shallowRef<Partial<Record<ProductFormField, true>>>({});
const hasSaveOutcome = computed(
  () =>
    props.disabled || props.saveOutcome !== "idle" || props.saveError !== null,
);
const deleteOpen = shallowRef(false);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const nameId = `edit-product-name-${useId()}`;
const categoryId = `edit-product-category-${useId()}`;
const descriptionId = `edit-product-description-${useId()}`;
const activeLabelId = `edit-product-active-${useId()}`;
const availableLabelId = `edit-product-available-${useId()}`;
const categoryErrorId = `edit-product-category-error-${useId()}`;
const nameErrorId = `edit-product-name-error-${useId()}`;
const descriptionErrorId = `edit-product-description-error-${useId()}`;
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
  localError(
    "categoryId",
    Boolean(categoryIdValue.value),
    "Выберите категорию",
  ),
);
const nameError = computed(() =>
  localError("name", Boolean(name.value.trim()), "Введите название товара"),
);
const descriptionError = computed(() => fieldError("description"));
const priceError = computed(() =>
  localError(
    "price",
    isNonNegativeInteger(price.value),
    "Укажите цену в целых рублях",
  ),
);
const activeError = computed(() => fieldError("isActive"));
const availableError = computed(() => fieldError("isAvailable"));
const isValid = computed(
  () =>
    Boolean(categoryIdValue.value) &&
    Boolean(name.value.trim()) &&
    (isMultiple.value
      ? priceChoices.value.every(validChoice)
      : isNonNegativeInteger(price.value) && !fieldError("price")),
);

function isNonNegativeInteger(value: string): boolean {
  return /^\d+$/.test(value);
}
function validChoice(choice: PriceChoiceDraft): boolean {
  return (
    isNonNegativeInteger(choice.price) && Boolean(choice.portionLabel.trim())
  );
}
function choiceError(index: number): string | undefined {
  const choice = priceChoices.value[index];
  return choice && !validChoice(choice)
    ? "Укажите подпись порции и цену в целых рублях"
    : fieldError(`priceChoices.${index}.price` as ProductFormField);
}
function fieldError(field: ProductFormField): string | undefined {
  return dismissedFieldErrors.value[field]
    ? undefined
    : props.fieldErrors[field];
}
function localError(
  field: ProductFormField,
  valid: boolean,
  message: string,
): string | undefined {
  return (
    fieldError(field) ?? (!valid && touched.value[field] ? message : undefined)
  );
}
function touch(field: ProductFormField): void {
  touched.value = { ...touched.value, [field]: true };
}
function dismissFieldError(field: ProductFormField): void {
  dismissedFieldErrors.value = { ...dismissedFieldErrors.value, [field]: true };
}
function resetDraft(): void {
  const product = props.product;
  categoryIdValue.value = product?.categoryId ?? "";
  name.value = product?.name ?? "";
  description.value = product?.description ?? "";
  price.value = product?.price?.toString() ?? "";
  portionLabel.value = product?.portionLabel ?? "";
  priceChoices.value = (product?.priceChoices ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((choice) => ({ ...choice, price: choice.price.toString() }));
  isMultiple.value = priceChoices.value.length > 1;
  if (priceChoices.value.length === 1) {
    const [choice] = priceChoices.value;
    price.value = choice.price;
    portionLabel.value = choice.portionLabel;
    priceChoices.value = [];
  }
  isActive.value = product?.isActive ?? true;
  isAvailable.value = product?.isAvailable ?? true;
  dismissedFieldErrors.value = {};
  touched.value = {};
}
function closeDialog(): void {
  if (props.disabled) return;
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
  if (props.disabled) return;
  if (value) open.value = true;
  else closeAsCancelled();
}
function enableMultiple(): void {
  priceChoices.value = [
    {
      portionLabel: portionLabel.value,
      price: price.value,
      isAvailable: isAvailable.value,
    },
    createPriceChoiceDraft(),
  ];
  isMultiple.value = true;
}
function addChoice(): void {
  priceChoices.value = [...priceChoices.value, createPriceChoiceDraft()];
}
function updateChoice(
  index: number,
  field: "isAvailable" | "portionLabel" | "price",
  value: boolean | string,
): void {
  priceChoices.value = priceChoices.value.map((choice, current) =>
    current === index ? { ...choice, [field]: value } : choice,
  );
}
function removeChoice(index: number): void {
  priceChoices.value = priceChoices.value.filter(
    (_, current) => current !== index,
  );
  if (priceChoices.value.length === 1) {
    const [choice] = priceChoices.value;
    price.value = choice.price;
    portionLabel.value = choice.portionLabel;
    priceChoices.value = [];
    isMultiple.value = false;
  }
}
function moveChoice(index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (target < 0 || target >= priceChoices.value.length) return;
  const next = [...priceChoices.value];
  [next[index], next[target]] = [next[target]!, next[index]!];
  priceChoices.value = next;
}
function updateIsActive(value: boolean | null): void {
  if (props.disabled) return;
  isActive.value = Boolean(value);
  dismissFieldError("isActive");
}
function updateIsAvailable(value: boolean | null): void {
  if (props.disabled) return;
  isAvailable.value = Boolean(value);
  dismissFieldError("isAvailable");
}
function save(): void {
  if (props.disabled) return;
  touched.value = {
    categoryId: true,
    name: true,
    price: true,
    priceChoices: true,
  };
  if (!isValid.value) return;
  const data: ProductFormData = {
    categoryId: categoryIdValue.value,
    type: "OTHER",
    name: name.value.trim(),
    description: description.value.trim(),
    isActive: isActive.value,
    isAvailable: isAvailable.value,
    price: isMultiple.value ? null : Number(price.value),
    portionLabel: isMultiple.value ? null : portionLabel.value.trim() || null,
    priceChoices: isMultiple.value
      ? priceChoices.value.map((choice, sortOrder) => ({
          ...(choice.id ? { id: choice.id } : {}),
          portionLabel: choice.portionLabel.trim(),
          price: Number(choice.price),
          sortOrder,
          isAvailable: choice.isAvailable,
        }))
      : [],
    variants: [],
  } satisfies PriceOptionProductFormData;
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
  { immediate: true },
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
  flex: none;
  display: grid;
  inline-size: min(100vw, 28rem);
  min-inline-size: 0;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  block-size: min(
    44rem,
    calc(100dvh - var(--expressa-space-xl) - var(--expressa-space-xl))
  );
  min-block-size: 0;
  overflow: hidden;
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}
.edit-dialog-category {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
}
.edit-dialog-fields {
  min-inline-size: 0;
  min-block-size: 0;
  display: grid;
  gap: calc(var(--expressa-space-md) + var(--expressa-space-xs));
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
.edit-dialog-fields label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-body);
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
  gap: var(--expressa-border-width-none);
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
.edit-dialog-outcome {
  display: grid;
  max-block-size: 10rem;
  gap: var(--expressa-space-sm);
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
  overflow-y: auto;
  overflow-wrap: anywhere;
}
.edit-dialog-outcome > p {
  margin: 0;
}
.edit-dialog-technical-details {
  min-width: 0;
}
.edit-dialog-technical-details p {
  margin: var(--expressa-space-sm) 0 0;
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
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
}
</style>
