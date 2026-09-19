<template>
  <AdminDialog
    :model-value="open"
    max-width="560"
    :persistent="props.disabled"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="add-dialog">
      <h2 class="add-dialog__title">Новый товар</h2>
      <section
        v-if="hasSaveOutcome"
        class="add-dialog-outcome"
        aria-live="polite"
      >
        <p v-if="props.disabled" role="status">Сохраняем товар…</p>
        <p
          v-else-if="props.saveOutcome === 'rejected'"
          class="add-dialog__error"
          role="alert"
        >
          Не удалось сохранить товар. Исправьте отмеченные поля и сохраните ещё
          раз.
        </p>
        <template v-else-if="props.saveOutcome === 'unconfirmed'">
          <p class="add-dialog__error" role="alert">
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
        <details v-if="props.saveError" class="add-dialog-technical-details">
          <summary>Технические сведения</summary>
          <p>{{ props.saveError.message }}</p>
          <p v-if="props.saveError.requestId">
            Идентификатор запроса: {{ props.saveError.requestId }}
          </p>
        </details>
        <AdminButton
          v-if="canDiscardDraft"
          type="button"
          variant="ghost"
          @click="discardDraft"
          >Закрыть форму</AdminButton
        >
      </section>
      <v-card-text class="add-dialog__fields">
        <label :for="categoryId">Категория</label>
        <AdminSelect
          :id="categoryId"
          ref="categoryInput"
          v-model="categoryIdValue"
          :disabled="props.disabled"
          ><option value="">Выберите категорию</option>
          <option
            v-for="category in props.categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option></AdminSelect
        >
        <p v-if="errorFor('categoryId')" class="add-dialog__error" role="alert">
          {{ errorFor("categoryId") }}
        </p>
        <label :for="nameId">Название товара</label
        ><AdminTextField
          :id="nameId"
          v-model="name"
          :aria-invalid="Boolean(errorFor('name'))"
          :disabled="props.disabled"
          placeholder="Например: Капучино"
        />
        <p v-if="errorFor('name')" class="add-dialog__error" role="alert">
          {{ errorFor("name") }}
        </p>
        <label :for="descriptionId">Описание</label
        ><AdminTextField
          :id="descriptionId"
          v-model="description"
          :disabled="props.disabled"
        />
        <section class="add-dialog__pricing" aria-label="Цены и порции">
          <div class="add-dialog__pricing-heading">
            <strong>Цена и порция</strong
            ><AdminButton
              v-if="!isMultiple"
              :disabled="props.disabled"
              type="button"
              variant="secondary"
              @click="enableMultiple"
              >Несколько цен</AdminButton
            >
          </div>
          <template v-if="!isMultiple"
            ><PriceFields
              v-model:price="price"
              v-model:portion-label="portionLabel"
              :disabled="props.disabled"
              :error="errorFor('price') ?? errorFor('portionLabel')"
          /></template>
          <template v-else
            ><section
              v-for="(choice, index) in priceChoices"
              :key="choice.id ?? index"
              :aria-label="`Вариант ${index + 1}`"
              class="add-dialog__choice"
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
              <div class="add-dialog__choice-actions">
                <AdminToggle
                  :model-value="choice.isAvailable"
                  :aria-label="`Вариант ${index + 1} доступен`"
                  :disabled="props.disabled"
                  @update:model-value="choice.isAvailable = Boolean($event)"
                /><AdminButton
                  :aria-label="`Поднять вариант ${index + 1}`"
                  :disabled="props.disabled || index === 0"
                  type="button"
                  variant="ghost"
                  @click="moveChoice(index, -1)"
                  >↑</AdminButton
                ><AdminButton
                  :aria-label="`Опустить вариант ${index + 1}`"
                  :disabled="
                    props.disabled || index === priceChoices.length - 1
                  "
                  type="button"
                  variant="ghost"
                  @click="moveChoice(index, 1)"
                  >↓</AdminButton
                ><AdminButton
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
            ></template
          >
        </section>
        <div class="add-dialog__toggle">
          <strong>Товар активен</strong
          ><AdminToggle
            :model-value="isActive"
            aria-label="Товар активен"
            :disabled="props.disabled"
            @update:model-value="isActive = Boolean($event)"
          />
        </div>
        <div class="add-dialog__toggle">
          <strong>Товар доступен</strong
          ><AdminToggle
            :model-value="isAvailable"
            aria-label="Товар доступен"
            :disabled="props.disabled"
            @update:model-value="isAvailable = Boolean($event)"
          />
        </div>
      </v-card-text>
      <v-card-actions class="admin-dialog-actions"
        ><AdminButton
          :disabled="isProtected || !isValid"
          type="button"
          @click="confirm"
          >Добавить товар</AdminButton
        ><AdminButton
          :disabled="isProtected"
          type="button"
          variant="ghost"
          @click="cancel"
          >Отмена</AdminButton
        ></v-card-actions
      >
    </v-card>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../../shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import { createPriceChoiceDraft } from "./AddProductDialog.constants";
import PriceFields from "./PriceFields.vue";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  AddProductDialogEmits,
  AddProductDialogProps,
  PriceChoiceDraft,
  PriceOptionProductFormData,
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
const priceChoices = shallowRef<PriceChoiceDraft[]>([]);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const categoryId = `add-product-category-${useId()}`;
const nameId = `add-product-name-${useId()}`;
const descriptionId = `add-product-description-${useId()}`;
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
function choiceError(index: number): string | undefined {
  const choice = priceChoices.value[index];
  return choice && !validChoice(choice)
    ? "Укажите подпись порции и цену в целых рублях"
    : errorFor(`priceChoices.${index}.price` as ProductFormField);
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
  field: "portionLabel" | "price",
  value: string,
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
function confirm(): void {
  if (isProtected.value || !isValid.value) return;
  emit("confirm", {
    categoryId: categoryIdValue.value,
    type: "OTHER",
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
    variants: [],
  } satisfies PriceOptionProductFormData);
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
  if (!value && !isProtected.value) cancel();
  else open.value = value;
}
function focusFirstField(): void {
  categoryInput.value?.$el.focus();
}
watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) captureReturnFocus();
  if (!isOpen && wasOpen) {
    reset();
    restoreFocus();
  }
});
</script>

<style scoped lang="scss">
.add-dialog__fields,
.add-dialog__pricing {
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
.add-dialog__choice {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-sm);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
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
.add-dialog-technical-details {
  overflow-wrap: anywhere;
}
</style>
