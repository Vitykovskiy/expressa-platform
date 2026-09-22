<template>
  <AdminDialog
    :aria-labelledby="titleId"
    cancel-label="Отмена"
    :dismiss-disabled="props.disabled"
    :model-value="open"
    max-width="560"
    :pending="props.disabled"
    submit-form="add-product-dialog-form"
    :submit-disabled="props.disabled || !isValid"
    submit-label="Сохранить"
    title="Новый товар"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <form
      id="add-product-dialog-form"
      class="add-dialog"
      @submit.prevent="confirm"
    >
      <div class="add-dialog__fields">
        <AdminFieldWrapper
          :id="categoryId"
          v-slot="field"
          :error="errorFor('categoryId')"
          label="Категория"
          required
        >
          <AdminSelect
            :id="field.controlId"
            ref="categoryInput"
            v-model="categoryIdValue"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
            :disabled="props.disabled"
            :items="categoryOptions"
            placeholder="Выберите категорию"
            :required="field.required"
          />
        </AdminFieldWrapper>
        <AdminFieldWrapper
          :id="nameId"
          v-slot="field"
          :error="errorFor('name')"
          label="Название товара"
          required
        >
          <AdminTextField
            :id="field.controlId"
            v-model="name"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
            :disabled="props.disabled"
            :required="field.required"
          />
        </AdminFieldWrapper>
        <AdminFieldWrapper :id="descriptionId" v-slot="field" label="Описание">
          <AdminTextField
            :id="field.controlId"
            v-model="description"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
            :disabled="props.disabled"
            :required="field.required"
          />
        </AdminFieldWrapper>
        <section class="add-dialog__pricing" aria-label="Цены и порции">
          <div v-if="isMultiple" class="add-dialog__price-columns">
            <span class="add-dialog__visually-hidden">Порядок</span
            ><span>Порция</span><span>Цена</span><span>Доступен</span
            ><span class="add-dialog__visually-hidden">Удалить</span>
          </div>
          <template v-if="!isMultiple">
            <PriceFields
              v-model:price="price"
              v-model:portion-label="portionLabel"
              :disabled="props.disabled"
              :price-error="errorFor('price')"
              :portion-label-error="errorFor('portionLabel')"
            />
            <AdminButton
              v-if="!isMultiple"
              :disabled="props.disabled"
              type="button"
              variant="secondary"
              @click="enableMultiple"
              >Добавить ещё цену</AdminButton
            >
          </template>
          <template v-else
            ><section
              v-for="(choice, index) in priceChoices"
              :key="choice.localId"
              :data-price-choice-id="choice.localId"
              :aria-label="`Вариант ${index + 1}`"
              class="add-dialog__choice"
              :class="{
                'add-dialog__choice--dragging':
                  draggedChoiceId === choice.localId,
              }"
              role="group"
              @dragover.prevent
              @drop="dropChoice(index)"
            >
              <div class="add-dialog__choice-order">
                <button
                  :aria-label="`Переместить вариант ${index + 1}; позиция ${index + 1} из ${priceChoices.length}`"
                  class="add-dialog__drag-handle"
                  :disabled="props.disabled"
                  draggable="true"
                  type="button"
                  @dragend="draggedChoiceId = null"
                  @dragstart="draggedChoiceId = choice.localId"
                  @keydown.up.prevent="moveChoice(index, -1)"
                  @keydown.down.prevent="moveChoice(index, 1)"
                >
                  ↕
                </button>
                <span>{{ index + 1 }}</span>
              </div>
              <div class="add-dialog__price-cell">
                <AdminTextField
                  :aria-label="`Порция варианта ${index + 1}`"
                  :aria-invalid="
                    Boolean(choicePortionLabelError(choice, index))
                  "
                  :aria-describedby="
                    choicePortionLabelError(choice, index)
                      ? `price-choice-${choice.localId}-portion-error`
                      : undefined
                  "
                  :disabled="props.disabled"
                  :model-value="choice.portionLabel"
                  placeholder="Порция"
                  required
                  @blur="touchChoice(choice.localId, 'portionLabel')"
                  @update:model-value="
                    updateChoice(index, 'portionLabel', $event)
                  "
                />
                <p
                  v-if="choicePortionLabelError(choice, index)"
                  :id="`price-choice-${choice.localId}-portion-error`"
                  class="add-dialog__field-error"
                >
                  {{ choicePortionLabelError(choice, index) }}
                </p>
              </div>
              <div class="add-dialog__price-cell">
                <AdminTextField
                  :aria-label="`Цена варианта ${index + 1}`"
                  :aria-invalid="Boolean(choicePriceError(choice, index))"
                  :aria-describedby="
                    choicePriceError(choice, index)
                      ? `price-choice-${choice.localId}-price-error`
                      : undefined
                  "
                  :disabled="props.disabled"
                  inputmode="numeric"
                  :model-value="choice.price"
                  placeholder="Цена, ₽"
                  required
                  type="number"
                  @blur="touchChoice(choice.localId, 'price')"
                  @update:model-value="updateChoice(index, 'price', $event)"
                />
                <p
                  v-if="choicePriceError(choice, index)"
                  :id="`price-choice-${choice.localId}-price-error`"
                  class="add-dialog__field-error"
                >
                  {{ choicePriceError(choice, index) }}
                </p>
              </div>
              <div class="add-dialog__choice-actions">
                <AdminFieldWrapper
                  :id="priceAvailabilityControlId(choice.localId)"
                  v-slot="field"
                  label="Доступен для заказа"
                  layout="row"
                >
                  <AdminToggle
                    :id="field.controlId"
                    :aria-labelledby="field.labelId"
                    :aria-describedby="field.describedBy"
                    :aria-invalid="field.invalid"
                    :aria-required="field.required"
                    :model-value="choice.isAvailable"
                    :disabled="props.disabled"
                    @update:model-value="
                      updateChoiceAvailability(index, $event)
                    "
                  />
                </AdminFieldWrapper>
                <AdminButton
                  :aria-label="`Удалить вариант ${index + 1}`"
                  :disabled="props.disabled"
                  type="button"
                  variant="ghost"
                  @click="removeChoice(index)"
                  >Удалить цену</AdminButton
                >
              </div>
            </section>
            <AdminButton
              :disabled="props.disabled"
              type="button"
              variant="secondary"
              @click="addChoice"
              >Добавить ещё цену</AdminButton
            ></template
          >
          <p class="add-dialog__reorder-status" role="status">
            {{ reorderStatus }}
          </p>
        </section>
        <section class="add-dialog__publication">
          <h3>Публикация</h3>
          <AdminFieldWrapper
            :id="isActiveControlId"
            v-slot="field"
            label="Показывать в меню"
            layout="row"
          >
            <AdminToggle
              :id="field.controlId"
              :aria-labelledby="field.labelId"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              :model-value="isActive"
              :disabled="props.disabled"
              @update:model-value="isActive = Boolean($event)"
            />
          </AdminFieldWrapper>
          <AdminFieldWrapper
            v-if="!isMultiple"
            :id="isAvailableControlId"
            v-slot="field"
            label="Доступен для заказа"
            layout="row"
          >
            <AdminToggle
              :id="field.controlId"
              :aria-labelledby="field.labelId"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              :model-value="isAvailable"
              :disabled="props.disabled"
              @update:model-value="isAvailable = Boolean($event)"
            />
          </AdminFieldWrapper>
        </section>
      </div>
    </form>
  </AdminDialog>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../../shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import { createPriceChoiceDraft } from "./AddProductDialog.constants";
import PriceFields from "./PriceFields.vue";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  AddProductDialogEmits,
  AddProductDialogProps,
  PriceChoiceDraft,
  CreateProductFormData,
  ProductFormField,
} from "./AddProductDialog.types";

const props = withDefaults(defineProps<AddProductDialogProps>(), {
  fieldErrors: () => ({}),
});
const emit = defineEmits<AddProductDialogEmits>();
const open = defineModel<boolean>("open", { required: true });
const categoryIdValue = shallowRef("");
const name = shallowRef("");
const description = shallowRef("");
const price = shallowRef("");
const portionLabel = shallowRef("");
const isActive = shallowRef(true);
const isAvailable = shallowRef(true);
const isMultiple = shallowRef(false);
type LocalPriceChoiceDraft = PriceChoiceDraft & { localId: string };
type PriceChoiceField = "price" | "portionLabel";
const priceChoices = shallowRef<LocalPriceChoiceDraft[]>([]);
const priceChoiceTouched = shallowRef<
  Partial<Record<string, Partial<Record<PriceChoiceField, true>>>>
>({});
const dismissedChoiceFieldErrors = shallowRef<Record<string, true>>({});
const programmaticChoiceFocus = shallowRef<string | null>(null);
const draggedChoiceId = shallowRef<string | null>(null);
const reorderStatus = shallowRef("");
let nextPriceChoiceLocalId = 0;
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const titleId = `add-product-title-${useId()}`;
const categoryId = `add-product-category-${useId()}`;
const nameId = `add-product-name-${useId()}`;
const descriptionId = `add-product-description-${useId()}`;
const isActiveControlId = `add-product-active-${useId()}`;
const isAvailableControlId = `add-product-available-${useId()}`;
const categoryInput =
  useTemplateRef<InstanceType<typeof AdminSelect>>("categoryInput");
const isValid = computed(
  () =>
    Boolean(categoryIdValue.value && name.value.trim()) &&
    (isMultiple.value
      ? priceChoices.value.every(validChoice)
      : validPrice(price.value)),
);
const categoryOptions = computed(() =>
  props.categories.map((category) => ({
    title: category.name,
    value: category.id,
  })),
);
function validPrice(value: string): boolean {
  return /^\d+$/.test(value);
}
function validChoice(choice: PriceChoiceDraft): boolean {
  return validPrice(choice.price) && Boolean(choice.portionLabel.trim());
}
function errorFor(field: ProductFormField): string | undefined {
  return props.fieldErrors[field];
}
function createLocalChoice(
  choice: PriceChoiceDraft = createPriceChoiceDraft(),
): LocalPriceChoiceDraft {
  nextPriceChoiceLocalId += 1;
  return { ...choice, localId: `add-price-choice-${nextPriceChoiceLocalId}` };
}
function choiceFieldError(
  choice: LocalPriceChoiceDraft,
  index: number,
  field: PriceChoiceField,
): string | undefined {
  return dismissedChoiceFieldErrors.value[`${choice.localId}:${field}`]
    ? undefined
    : errorFor(`priceChoices.${index}.${field}` as ProductFormField);
}
function choicePriceError(
  choice: LocalPriceChoiceDraft,
  index: number,
): string | undefined {
  return (
    choiceFieldError(choice, index, "price") ??
    (priceChoiceTouched.value[choice.localId]?.price &&
    !validPrice(choice.price)
      ? "Укажите цену в целых рублях"
      : undefined)
  );
}
function choicePortionLabelError(
  choice: LocalPriceChoiceDraft,
  index: number,
): string | undefined {
  return (
    choiceFieldError(choice, index, "portionLabel") ??
    (priceChoiceTouched.value[choice.localId]?.portionLabel &&
    !choice.portionLabel.trim()
      ? "Выберите порцию или размер"
      : undefined)
  );
}
function touchChoice(localId: string, field: PriceChoiceField): void {
  if (programmaticChoiceFocus.value === `${localId}:${field}`) {
    programmaticChoiceFocus.value = null;
    return;
  }
  priceChoiceTouched.value = {
    ...priceChoiceTouched.value,
    [localId]: { ...priceChoiceTouched.value[localId], [field]: true },
  };
}
function focusChoice(localId: string): void {
  void nextTick(() => {
    const field = document.querySelector<HTMLElement>(
      `[data-price-choice-id="${localId}"] input, [data-price-choice-id="${localId}"] select`,
    );
    if (field) {
      programmaticChoiceFocus.value = `${localId}:portionLabel`;
      field.focus();
    }
  });
}
function enableMultiple(): void {
  priceChoices.value = [
    createLocalChoice({
      portionLabel: portionLabel.value,
      price: price.value,
      isAvailable: isAvailable.value,
    }),
    createLocalChoice(),
  ];
  isMultiple.value = true;
  priceChoiceTouched.value = {};
  focusChoice(priceChoices.value[1]!.localId);
}
function addChoice(): void {
  const choice = createLocalChoice();
  priceChoices.value = [...priceChoices.value, choice];
  focusChoice(choice.localId);
}
function updateChoice(
  index: number,
  field: "portionLabel" | "price",
  value: string,
): void {
  const choice = priceChoices.value[index]!;
  if (programmaticChoiceFocus.value === `${choice.localId}:${field}`) {
    programmaticChoiceFocus.value = null;
  }
  dismissedChoiceFieldErrors.value = {
    ...dismissedChoiceFieldErrors.value,
    [`${choice.localId}:${field}`]: true,
  };
  priceChoices.value = priceChoices.value.map((choice, current) =>
    current === index ? { ...choice, [field]: value } : choice,
  );
}
function updateChoiceAvailability(index: number, value: unknown): void {
  priceChoices.value = priceChoices.value.map((choice, current) =>
    current === index ? { ...choice, isAvailable: value === true } : choice,
  );
}
function removeChoice(index: number): void {
  const next = priceChoices.value.filter((_, current) => current !== index);
  priceChoices.value = next;
  if (next.length === 1) {
    const [choice] = next;
    price.value = choice.price;
    portionLabel.value = choice.portionLabel;
    isMultiple.value = false;
  } else {
    focusChoice(next[Math.min(index, next.length - 1)]!.localId);
  }
}
function moveChoice(index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (target < 0 || target >= priceChoices.value.length) return;
  const next = [...priceChoices.value];
  [next[index], next[target]] = [next[target]!, next[index]!];
  priceChoices.value = next;
  reorderStatus.value = `Вариант перемещён на позицию ${target + 1} из ${next.length}`;
  focusChoice(next[target]!.localId);
}
function dropChoice(targetIndex: number): void {
  const sourceIndex = priceChoices.value.findIndex(
    (choice) => choice.localId === draggedChoiceId.value,
  );
  draggedChoiceId.value = null;
  if (sourceIndex < 0 || sourceIndex === targetIndex) return;
  const next = [...priceChoices.value];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved!);
  priceChoices.value = next;
  reorderStatus.value = `Вариант перемещён на позицию ${targetIndex + 1} из ${next.length}`;
  focusChoice(moved!.localId);
}
function confirm(): void {
  if (props.disabled || !isValid.value) return;
  emit("confirm", {
    categoryId: categoryIdValue.value,
    name: name.value.trim(),
    description: description.value,
    isActive: isActive.value,
    isAvailable: isAvailable.value,
    price: isMultiple.value ? null : Number(price.value),
    portionLabel: isMultiple.value ? null : portionLabel.value.trim() || null,
    priceChoices: isMultiple.value
      ? priceChoices.value.map((choice, sortOrder) => ({
          id: choice.id,
          portionLabel: choice.portionLabel.trim(),
          price: Number(choice.price),
          sortOrder,
          isAvailable: choice.isAvailable,
        }))
      : [],
  } satisfies CreateProductFormData);
}
function reset(): void {
  categoryIdValue.value = "";
  name.value = "";
  description.value = "";
  price.value = "";
  portionLabel.value = "";
  isActive.value = true;
  isAvailable.value = true;
  isMultiple.value = false;
  priceChoices.value = [];
  priceChoiceTouched.value = {};
  dismissedChoiceFieldErrors.value = {};
  programmaticChoiceFocus.value = null;
}
function closeDialog(): void {
  if (props.disabled) return;
  reset();
  open.value = false;
  restoreFocus();
}
function cancel(): void {
  if (props.disabled) return;
  closeDialog();
  emit("cancel");
}
function updateOpen(value: boolean): void {
  if (value) {
    open.value = true;
    return;
  }
  if (props.disabled) return;
  cancel();
}
function focusFirstField(): void {
  categoryInput.value?.focus();
}
function priceAvailabilityControlId(localId: string): string {
  return `add-product-price-availability-${localId}`;
}
watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) captureReturnFocus();
  if (!isOpen && wasOpen) {
    reset();
    restoreFocus();
  }
});
watch(
  () => props.fieldErrors,
  () => {
    dismissedChoiceFieldErrors.value = {};
  },
);
</script>

<style scoped lang="scss">
.add-dialog__fields,
.add-dialog__pricing,
.add-dialog__publication {
  display: grid;
  gap: var(--expressa-space-sm);
}
.add-dialog__pricing {
  --add-dialog-price-grid: auto minmax(0, 1fr) minmax(0, 1fr) auto auto;
  gap: var(--expressa-space-md);
}
.add-dialog__pricing-heading,
.add-dialog__toggle,
.add-dialog__choice-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
}
.add-dialog__price-columns {
  display: grid;
  grid-template-columns: var(--add-dialog-price-grid);
  gap: var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-caption);
}
.add-dialog__pricing-heading h3,
.add-dialog__publication h3,
.add-dialog__choice h4,
.add-dialog__publication p {
  margin: 0;
}
.add-dialog__choice {
  display: grid;
  grid-template-columns: var(--add-dialog-price-grid);
  gap: var(--expressa-space-sm) var(--expressa-space-md);
  padding-block: var(--expressa-space-sm);
  border-block-end: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.add-dialog__choice-order {
  display: flex;
  align-items: center;
  gap: var(--expressa-space-xs);
}
.add-dialog__drag-handle {
  min-width: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
  border: var(--expressa-border-width-none);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
  cursor: grab;
}
.add-dialog__drag-handle:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}
.add-dialog__choice--dragging {
  opacity: var(--expressa-state-disabled-opacity);
}
.add-dialog__reorder-status {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.add-dialog__choice-actions {
  grid-column: 4 / -1;
  justify-content: space-between;
}
.add-dialog__price-cell {
  min-width: 0;
}
.add-dialog__field-error {
  margin: var(--expressa-space-2xs) 0 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
}
.add-dialog__visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
@media (max-width: 599px) {
  .add-dialog__pricing {
    --add-dialog-price-grid: auto minmax(0, 1fr) minmax(0, 1fr);
  }
  .add-dialog__choice-actions {
    grid-column: 1 / -1;
  }
}
.add-dialog__order-label,
.add-dialog__publication p {
  color: var(--expressa-color-text-secondary);
}
</style>
