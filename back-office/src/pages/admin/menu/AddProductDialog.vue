<template>
  <AdminDialog
    :aria-labelledby="titleId"
    cancel-label="Отмена"
    :dismiss-disabled="isProtected"
    :model-value="open"
    max-width="560"
    :pending="props.disabled"
    submit-form="add-product-dialog-form"
    :submit-disabled="isProtected || !isValid"
    submit-label="Добавить товар"
    submit-pending-label="Сохраняем товар…"
    title="Новый товар"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <form
      id="add-product-dialog-form"
      class="add-dialog"
      @submit.prevent="confirm"
    >
      <section
        v-if="hasSaveOutcome"
        class="add-dialog-outcome"
        aria-live="polite"
      >
        <p
          v-if="props.saveOutcome === 'rejected'"
          class="add-dialog__error"
          role="alert"
        >
          Не удалось сохранить товар.
        </p>
        <template v-else-if="props.saveOutcome === 'unconfirmed'">
          <p class="add-dialog__error" role="alert">
            Не удалось подтвердить сохранение товара.
          </p>
          <AdminButton
            :disabled="props.disabled"
            type="button"
            @click="emit('refresh')"
            >Обновить меню</AdminButton
          >
        </template>
        <p v-else-if="props.saveOutcome === 'saved'" role="status">
          Меню обновлено.
        </p>
        <AdminButton
          v-if="canDiscardDraft"
          type="button"
          variant="ghost"
          @click="discardDraft"
          >Закрыть форму</AdminButton
        >
      </section>
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
            :required="field.required"
            ><option value="">Выберите категорию</option>
            <option
              v-for="category in props.categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option></AdminSelect
          >
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
          <div class="add-dialog__pricing-heading">
            <h3>Цены и порции</h3>
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
              role="group"
            >
              <h4>Цена {{ index + 1 }}</h4>
              <PriceFields
                :price="choice.price"
                :portion-label="choice.portionLabel"
                :disabled="props.disabled"
                :price-error="choicePriceError(choice, index)"
                :portion-label-error="choicePortionLabelError(choice, index)"
                required-label
                @blur:price="touchChoice(choice.localId, 'price')"
                @blur:portion-label="
                  touchChoice(choice.localId, 'portionLabel')
                "
                @update:price="updateChoice(index, 'price', $event)"
                @update:portion-label="
                  updateChoice(index, 'portionLabel', $event)
                "
              />
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
                    @update:model-value="choice.isAvailable = Boolean($event)"
                  />
                </AdminFieldWrapper>
                <span class="add-dialog__order-label">Порядок</span>
                <AdminButton
                  :aria-label="`Поднять вариант ${index + 1}`"
                  :disabled="props.disabled || index === 0"
                  type="button"
                  variant="ghost"
                  @click="moveChoice(index, -1)"
                  >Выше</AdminButton
                ><AdminButton
                  :aria-label="`Опустить вариант ${index + 1}`"
                  :disabled="
                    props.disabled || index === priceChoices.length - 1
                  "
                  type="button"
                  variant="ghost"
                  @click="moveChoice(index, 1)"
                  >Ниже</AdminButton
                ><AdminButton
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
const hasSaveOutcome = computed(
  () =>
    props.disabled || props.saveOutcome !== "idle" || props.saveError !== null,
);
const isProtected = computed(
  () =>
    props.disabled ||
    props.saveOutcome === "unconfirmed" ||
    props.saveOutcome === "saved",
);
const canDiscardDraft = computed(
  () =>
    !props.disabled &&
    (props.saveOutcome === "unconfirmed" || props.saveOutcome === "saved"),
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
      programmaticChoiceFocus.value = `${localId}:price`;
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
  focusChoice(next[target]!.localId);
}
function confirm(): void {
  if (isProtected.value || !isValid.value) return;
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
  if (isProtected.value) return;
  reset();
  open.value = false;
  restoreFocus();
}
function cancel(): void {
  if (isProtected.value) return;
  closeDialog();
  emit("cancel");
}
function discardDraft(): void {
  if (!canDiscardDraft.value) return;
  closeDialog();
  emit("cancel");
}
function updateOpen(value: boolean): void {
  if (value) {
    open.value = true;
    return;
  }
  if (isProtected.value) return;
  cancel();
}
function focusFirstField(): void {
  categoryInput.value?.$el.focus();
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
  padding-block: var(--expressa-space-sm);
}
.add-dialog__pricing-heading,
.add-dialog__toggle,
.add-dialog__choice-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
}
.add-dialog__pricing-heading h3,
.add-dialog__publication h3,
.add-dialog__choice h4,
.add-dialog__publication p {
  margin: 0;
}
.add-dialog__choice {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-sm);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
}
.add-dialog__choice-actions {
  flex-wrap: wrap;
  justify-content: flex-start;
}
.add-dialog__order-label,
.add-dialog__publication p {
  color: var(--expressa-color-text-secondary);
}
.add-dialog__error {
  margin: 0;
  color: var(--expressa-color-status-error);
}
.add-dialog-outcome {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: 0 var(--expressa-space-lg) var(--expressa-space-md);
}
</style>
