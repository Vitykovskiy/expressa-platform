<template>
  <AdminDialog
    action-size="compact"
    cancel-label="Отмена"
    :dismiss-disabled="props.disabled"
    :model-value="open"
    max-width="560"
    :pending="props.disabled"
    submit-form="add-product-dialog-form"
    :submit-disabled="props.disabled || !isValid"
    submit-label="Сохранить"
    title="Новый товар"
    @update:model-value="updateOpen"
  >
    <form
      id="add-product-dialog-form"
      class="add-dialog"
      @submit.prevent="confirm"
    >
      <div class="add-dialog__content">
        <section class="add-dialog__section">
          <div class="add-dialog__fields">
            <AdminFieldWrapper
              :id="categoryId"
              v-slot="field"
              :error="errorFor('categoryId')"
              label="Категория"
              required
              ><AdminCombobox
                :id="field.controlId"
                v-model="categoryIdValue"
                :disabled="props.disabled"
                :options="categoryOptions"
                :required="field.required"
            /></AdminFieldWrapper>
            <AdminFieldWrapper
              :id="nameId"
              v-slot="field"
              :error="errorFor('name')"
              label="Название товара"
              required
              ><AdminTextField
                :id="field.controlId"
                v-model="name"
                :disabled="props.disabled"
                :required="field.required"
            /></AdminFieldWrapper>
            <AdminFieldWrapper
              :id="isActiveControlId"
              v-slot="field"
              label="Показывать в меню"
              layout="row"
              ><AdminToggle
                :id="field.controlId"
                :model-value="isActive"
                :disabled="props.disabled"
                @update:model-value="isActive = Boolean($event)"
            /></AdminFieldWrapper>
            <AdminFieldWrapper
              :id="descriptionId"
              v-slot="field"
              label="Описание"
              ><AdminTextarea
                :id="field.controlId"
                v-model="description"
                :disabled="props.disabled"
                :required="field.required"
                rows="2"
                class="add-dialog__description"
            /></AdminFieldWrapper>
          </div>
        </section>
        <section class="add-dialog__section">
          <div class="add-dialog__section-heading">
            <h3
              id="add-product-pricing-title"
              class="add-dialog__section-title"
            >
              Цены
            </h3>
            <AdminButton
              :disabled="props.disabled"
              size="compact"
              type="button"
              variant="secondary"
              @click="openChoiceDialog()"
              >Добавить цену</AdminButton
            >
          </div>
          <div class="add-dialog__pricing-table">
            <table>
              <colgroup>
                <col class="add-dialog__choice-order-column" />
                <col class="add-dialog__choice-size-column" />
                <col class="add-dialog__choice-price-column" />
                <col class="add-dialog__choice-availability-column" />
                <col class="add-dialog__choice-actions-column" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">Порция / размер</th>
                  <th scope="col">Цена, ₽</th>
                  <th scope="col">В продаже</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="priceChoices.length === 0">
                  <td class="add-dialog__empty-prices" colspan="5">
                    Цены пока не добавлены
                  </td>
                </tr>
                <tr
                  v-for="(choice, index) in priceChoices"
                  :key="choice.localId"
                  :class="{
                    'add-dialog__choice--dragging':
                      draggedChoiceId === choice.localId,
                  }"
                  :style="choiceDragStyle(choice, index)"
                  :data-price-choice-id="choice.localId"
                >
                  <td>
                    <AdminButton
                      class="add-dialog__drag-handle"
                      :disabled="props.disabled || priceChoices.length < 2"
                      size="compact"
                      variant="ghost"
                      type="button"
                      @lostpointercapture="cancelChoiceDrag"
                      @pointercancel="cancelChoiceDrag"
                      @pointerdown="startChoiceDrag($event, choice.localId)"
                      @pointermove="moveChoiceDrag"
                      @pointerup="completeChoiceDrag"
                    >
                      <AdminIcon :icon="GripVertical" />
                    </AdminButton>
                  </td>
                  <td class="add-dialog__choice-value">
                    <span class="add-dialog__choice-size">{{
                      choice.portionLabel || "—"
                    }}</span>
                  </td>
                  <td class="add-dialog__choice-value add-dialog__choice-price">
                    {{ choice.price || "—"
                    }}<template v-if="choice.price"> ₽</template>
                  </td>
                  <td class="add-dialog__choice-availability">
                    <span class="add-dialog__availability-label"
                      >В продаже</span
                    >
                    <AdminToggle
                      :model-value="choice.isAvailable"
                      :disabled="props.disabled"
                      @update:model-value="
                        updateChoiceAvailability(index, $event)
                      "
                    />
                  </td>
                  <td>
                    <AdminActionGroup>
                      <AdminButton
                        :disabled="props.disabled"
                        size="compact"
                        :title="`Редактировать цену ${index + 1}`"
                        type="button"
                        variant="ghost"
                        @click="openChoiceDialog(choice)"
                        ><AdminIcon :icon="Pencil" /></AdminButton
                      ><AdminButton
                        :disabled="props.disabled"
                        size="compact"
                        :title="`Удалить цену ${index + 1}`"
                        type="button"
                        variant="destructive"
                        @click="removeChoice(index)"
                        ><AdminIcon :icon="Trash2"
                      /></AdminButton>
                    </AdminActionGroup>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </form>
  </AdminDialog>
  <PriceChoiceDialog
    v-model:open="choiceDialogOpen"
    :choice="choiceDraft"
    :disabled="props.disabled"
    :editing="editingChoiceId !== null"
    :required-label="
      requiringFirstLabel ||
      priceChoices.length > 1 ||
      (editingChoiceId === null && priceChoices.length > 0)
    "
    :used-labels="otherChoiceLabels"
    :price-error="
      choiceDraft.price === rejectedPrice ? errorFor('price') : undefined
    "
    @save="saveChoiceDialog"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, watch } from "vue";
import { GripVertical, Pencil, Trash2 } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminActionGroup from "../../../shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminCombobox from "../../../shared/ui/admin/admin-combobox/AdminCombobox.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminTextarea from "../../../shared/ui/admin/admin-textarea/AdminTextarea.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import { createPriceChoiceDraft } from "./AddProductDialog.constants";
import PriceChoiceDialog from "./PriceChoiceDialog.vue";
import type {
  AddProductDialogEmits,
  AddProductDialogProps,
  CreateProductFormData,
  PriceChoiceDraft,
  ProductFormField,
} from "./AddProductDialog.types";

type LocalPriceChoiceDraft = PriceChoiceDraft & { localId: string };
const props = withDefaults(defineProps<AddProductDialogProps>(), {
  fieldErrors: () => ({}),
});
const emit = defineEmits<AddProductDialogEmits>();
const open = defineModel<boolean>("open", { required: true });
const categoryIdValue = shallowRef("");
const name = shallowRef("");
const description = shallowRef("");
const isActive = shallowRef(true);
const priceChoices = shallowRef<LocalPriceChoiceDraft[]>([]);
const draggedChoiceId = shallowRef<string | null>(null);
const dragPointerId = shallowRef<number | null>(null);
const dragStartY = shallowRef(0);
const dragOffsetY = shallowRef(0);
const dragTargetIndex = shallowRef<number | null>(null);
const choiceDialogOpen = shallowRef(false);
const requiringFirstLabel = shallowRef(false);
const editingChoiceId = shallowRef<string | null>(null);
const choiceDraft = shallowRef<PriceChoiceDraft>(createPriceChoiceDraft());
const rejectedPrice = shallowRef<string | null>(null);
const otherChoiceLabels = computed(() =>
  priceChoices.value
    .filter((choice) => choice.localId !== editingChoiceId.value)
    .map((choice) => choice.portionLabel),
);
let nextPriceChoiceLocalId = 0;
const categoryId = `add-product-category-${useId()}`;
const nameId = `add-product-name-${useId()}`;
const descriptionId = `add-product-description-${useId()}`;
const isActiveControlId = `add-product-active-${useId()}`;
const isValid = computed(
  () =>
    Boolean(categoryIdValue.value && name.value.trim()) &&
    priceChoices.value.length > 0 &&
    priceChoices.value.every((choice) =>
      validChoice(choice, priceChoices.value.length),
    ) &&
    new Set(
      priceChoices.value.map((choice) => normalizeLabel(choice.portionLabel)),
    ).size === priceChoices.value.length,
);
const categoryOptions = computed(() =>
  props.categories.map((category) => ({
    label: category.name,
    id: category.id,
  })),
);
function validPrice(value: string): boolean {
  return /^\d+$/.test(value);
}
function validChoice(choice: PriceChoiceDraft, choiceCount: number): boolean {
  return (
    validPrice(choice.price) &&
    (choiceCount === 1 || Boolean(choice.portionLabel.trim()))
  );
}
function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
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
function openChoiceDialog(choice?: LocalPriceChoiceDraft): void {
  const firstChoice = priceChoices.value[0];
  requiringFirstLabel.value =
    !choice &&
    priceChoices.value.length === 1 &&
    !firstChoice?.portionLabel.trim();
  const targetChoice = requiringFirstLabel.value ? firstChoice : choice;
  editingChoiceId.value = targetChoice?.localId ?? null;
  choiceDraft.value = targetChoice
    ? { ...targetChoice }
    : createPriceChoiceDraft();
  choiceDialogOpen.value = true;
}
function saveChoiceDialog(choice: PriceChoiceDraft): void {
  if (editingChoiceId.value)
    priceChoices.value = priceChoices.value.map((current) =>
      current.localId === editingChoiceId.value
        ? { ...current, ...choice }
        : current,
    );
  else priceChoices.value = [...priceChoices.value, createLocalChoice(choice)];
  choiceDialogOpen.value = false;
  requiringFirstLabel.value = false;
}
function updateChoiceAvailability(index: number, value: unknown): void {
  priceChoices.value = priceChoices.value.map((choice, current) =>
    current === index ? { ...choice, isAvailable: value === true } : choice,
  );
}
function removeChoice(index: number): void {
  const next = priceChoices.value.filter((_, current) => current !== index);
  priceChoices.value = next;
}
function startChoiceDrag(event: PointerEvent, localId: string): void {
  if (props.disabled || priceChoices.value.length < 2 || draggedChoiceId.value)
    return;
  event.preventDefault();
  draggedChoiceId.value = localId;
  dragPointerId.value = event.pointerId;
  dragStartY.value = event.clientY;
  dragOffsetY.value = 0;
  dragTargetIndex.value = priceChoices.value.findIndex(
    (choice) => choice.localId === localId,
  );
  (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
}
function moveChoiceDrag(event: PointerEvent): void {
  if (event.pointerId !== dragPointerId.value || !draggedChoiceId.value) return;
  dragOffsetY.value = event.clientY - dragStartY.value;
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>("[data-price-choice-id]"),
  );
  const candidates = rows.filter(
    (row) => row.dataset.priceChoiceId !== draggedChoiceId.value,
  );
  if (candidates.length === 0) return;
  const target = candidates.reduce((nearest, row) => {
    const nearestDistance = Math.abs(
      event.clientY -
        (nearest.getBoundingClientRect().top +
          nearest.getBoundingClientRect().height / 2),
    );
    const distance = Math.abs(
      event.clientY -
        (row.getBoundingClientRect().top +
          row.getBoundingClientRect().height / 2),
    );
    return distance < nearestDistance ? row : nearest;
  });
  dragTargetIndex.value = priceChoices.value.findIndex(
    (choice) => choice.localId === target.dataset.priceChoiceId,
  );
}
function completeChoiceDrag(event: PointerEvent): void {
  if (event.pointerId !== dragPointerId.value) return;
  const sourceIndex = priceChoices.value.findIndex(
    (choice) => choice.localId === draggedChoiceId.value,
  );
  const targetIndex = dragTargetIndex.value;
  if (sourceIndex >= 0 && targetIndex !== null && sourceIndex !== targetIndex) {
    const next = [...priceChoices.value];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved!);
    priceChoices.value = next;
  }
  finishChoiceDrag(event.currentTarget as HTMLButtonElement);
}
function cancelChoiceDrag(): void {
  finishChoiceDrag();
}
function finishChoiceDrag(handle?: HTMLButtonElement): void {
  if (
    handle &&
    dragPointerId.value !== null &&
    handle.hasPointerCapture(dragPointerId.value)
  )
    handle.releasePointerCapture(dragPointerId.value);
  draggedChoiceId.value = null;
  dragPointerId.value = null;
  dragOffsetY.value = 0;
  dragTargetIndex.value = null;
}
function choiceDragStyle(
  choice: LocalPriceChoiceDraft,
  index: number,
): Record<string, string> | undefined {
  if (!draggedChoiceId.value || dragTargetIndex.value === null)
    return undefined;
  if (choice.localId === draggedChoiceId.value)
    return { transform: `translateY(${dragOffsetY.value}px)` };
  const sourceIndex = priceChoices.value.findIndex(
    (current) => current.localId === draggedChoiceId.value,
  );
  const targetIndex = dragTargetIndex.value;
  const movesUp =
    targetIndex < sourceIndex && index >= targetIndex && index < sourceIndex;
  const movesDown =
    targetIndex > sourceIndex && index <= targetIndex && index > sourceIndex;
  if (!movesUp && !movesDown) return undefined;
  const offset = movesUp ? "100%" : "-100%";
  return { transform: `translateY(${offset})` };
}
function confirm(): void {
  if (props.disabled || !isValid.value) return;
  const [singleChoice] = priceChoices.value;
  const isSingleChoice = priceChoices.value.length === 1;
  emit("confirm", {
    categoryId: categoryIdValue.value,
    name: name.value.trim(),
    description: description.value,
    isActive: isActive.value,
    isAvailable: isSingleChoice
      ? singleChoice!.isAvailable
      : priceChoices.value.some((choice) => choice.isAvailable),
    price: isSingleChoice ? Number(singleChoice!.price) : null,
    portionLabel: isSingleChoice
      ? singleChoice!.portionLabel.trim() || null
      : null,
    priceChoices: isSingleChoice
      ? []
      : priceChoices.value.map((choice, sortOrder) => ({
          id: choice.id,
          portionLabel: choice.portionLabel.trim(),
          price: Number(choice.price),
          sortOrder,
          isAvailable: choice.isAvailable,
        })),
  } satisfies CreateProductFormData);
}
function reset(): void {
  categoryIdValue.value = "";
  name.value = "";
  description.value = "";
  isActive.value = true;
  priceChoices.value = [];
  finishChoiceDrag();
  choiceDialogOpen.value = false;
  requiringFirstLabel.value = false;
  editingChoiceId.value = null;
  choiceDraft.value = createPriceChoiceDraft();
  rejectedPrice.value = null;
}
function closeDialog(): void {
  if (!props.disabled) {
    reset();
    open.value = false;
  }
}
function cancel(): void {
  if (!props.disabled) {
    closeDialog();
    emit("cancel");
  }
}
function updateOpen(value: boolean): void {
  if (value) open.value = true;
  else if (!props.disabled) cancel();
}
watch(open, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    reset();
  }
});
watch(
  () => props.fieldErrors.price,
  (priceError) => {
    if (priceError && open.value && priceChoices.value.length === 1) {
      rejectedPrice.value = priceChoices.value[0]!.price;
      openChoiceDialog(priceChoices.value[0]);
    }
  },
);
</script>

<style scoped lang="scss">
.add-dialog__content,
.add-dialog__section {
  display: grid;
  gap: var(--expressa-space-sm);
}
.add-dialog__fields {
  display: grid;
  gap: var(--expressa-space-md);
}
.add-dialog__content {
  gap: var(--expressa-space-md);
}
.add-dialog__section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
}
.add-dialog__section-title {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-body);
}
.add-dialog__pricing-table {
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.add-dialog__pricing-table table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.add-dialog__choice-order-column {
  width: var(--expressa-size-control-min-height);
}
.add-dialog__choice-price-column {
  width: calc(11ch + var(--expressa-space-sm) * 2);
}
.add-dialog__choice-availability-column {
  width: calc(
    var(--expressa-size-control-min-height) + var(--expressa-space-sm) * 2
  );
}
.add-dialog__choice-actions-column {
  width: calc(
    var(--expressa-size-control-min-height) * 2 + var(--expressa-space-sm)
  );
}
.add-dialog__pricing-table th {
  padding: var(--expressa-space-xs) var(--expressa-space-sm);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface-raised);
  font-size: var(--expressa-font-size-caption);
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-body);
  text-align: start;
  white-space: nowrap;
}
.add-dialog__pricing-table th:first-child,
.add-dialog__pricing-table td:first-child {
  padding-inline-start: 0;
}
.add-dialog__pricing-table th:last-child,
.add-dialog__pricing-table td:last-child {
  padding-inline-end: 0;
}
@media (min-width: 600px) {
  .add-dialog__pricing-table td:last-child {
    padding-inline-start: 0;
  }
}
.add-dialog__pricing-table tbody tr {
  transition: transform var(--expressa-motion-duration-control) ease-out;
}
.add-dialog__pricing-table td {
  padding: var(--expressa-space-xs) var(--expressa-space-sm);
  border-block-start: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  vertical-align: middle;
}
.add-dialog__choice--dragging {
  position: relative;
  z-index: 1;
  background: var(--expressa-color-surface-raised);
  box-shadow: var(--expressa-shadow-card);
  transition: transform none;
}
.add-dialog__drag-handle {
  cursor: grab;
  touch-action: none;
}
.add-dialog__choice-value {
  min-width: 0;
  color: var(--expressa-color-text-primary);
}
.add-dialog__choice-size {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.add-dialog__empty-prices {
  color: var(--expressa-color-text-secondary);
  text-align: center;
}
.add-dialog__choice-price {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.add-dialog__choice-availability {
  text-align: center;
}
.add-dialog__availability-label {
  display: none;
}
.add-dialog__description {
  min-height: calc(
    var(--expressa-font-size-body) * var(--expressa-line-height-body) * 2 +
      var(--expressa-space-control-block) * 2
  );
}
@media (max-width: 599px) {
  .add-dialog__section-heading {
    flex-wrap: wrap;
  }
  .add-dialog__pricing-table {
    border: 0;
  }
  .add-dialog__pricing-table table,
  .add-dialog__pricing-table tbody {
    display: block;
    width: 100%;
  }
  .add-dialog__pricing-table thead,
  .add-dialog__pricing-table colgroup {
    display: none;
  }
  .add-dialog__pricing-table tbody tr {
    display: grid;
    grid-template-columns:
      var(--expressa-size-control-min-height) minmax(0, 1fr)
      auto;
    align-items: center;
    border-block-start: var(--expressa-border-width-default) solid
      var(--expressa-color-border);
  }
  .add-dialog__pricing-table td {
    min-width: 0;
    padding: var(--expressa-space-2xs) 0;
    border: 0;
  }
  .add-dialog__pricing-table td:first-child {
    grid-column: 1;
    grid-row: 1;
  }
  .add-dialog__pricing-table td:nth-child(2) {
    grid-column: 2;
    grid-row: 1;
    padding-inline: var(--expressa-space-xs);
  }
  .add-dialog__pricing-table td:nth-child(3) {
    grid-column: 3;
    grid-row: 1;
    white-space: nowrap;
  }
  .add-dialog__pricing-table td:nth-child(4) {
    grid-column: 1 / 3;
    grid-row: 2;
  }
  .add-dialog__pricing-table td:nth-child(5) {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
  }
  .add-dialog__choice-size {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .add-dialog__choice-availability {
    display: flex;
    align-items: center;
    gap: var(--expressa-space-sm);
    color: var(--expressa-color-text-secondary);
    font-size: var(--expressa-font-size-caption);
    white-space: nowrap;
  }
  .add-dialog__availability-label {
    display: inline;
  }
  .add-dialog__pricing-table td.add-dialog__empty-prices {
    grid-column: 1 / -1;
    grid-row: 1;
    padding: var(--expressa-space-sm) 0;
  }
}
</style>
