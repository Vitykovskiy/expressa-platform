<template>
  <AdminDialog
    action-size="compact"
    cancel-label="Отмена"
    :dismiss-disabled="props.disabled"
    :model-value="open"
    max-width="560"
    :pending="props.disabled"
    submit-form="price-choice-dialog-form"
    submit-label="Сохранить"
    :title="props.editing ? 'Редактировать цену' : 'Добавить цену'"
    @cancel="emit('cancel')"
    @update:model-value="updateOpen"
  >
    <form
      id="price-choice-dialog-form"
      class="price-choice-dialog"
      novalidate
      @submit.prevent="save"
    >
      <PriceFields
        :price="draft.price"
        :portion-label="draft.portionLabel"
        :disabled="props.disabled"
        :price-error="
          errors.price ?? (serverPriceEdited ? undefined : props.priceError)
        "
        :portion-label-error="errors.portionLabel"
        :required-label="props.requiredLabel"
        @update:price="updatePrice"
        @update:portion-label="updatePortionLabel"
      />
    </form>
  </AdminDialog>
</template>

<script setup lang="ts">
import { shallowRef, watch } from "vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import PriceFields from "./PriceFields.vue";
import type { PriceChoiceDraft } from "./AddProductDialog.types";

const props = defineProps<{
  choice: PriceChoiceDraft;
  disabled: boolean;
  editing: boolean;
  requiredLabel: boolean;
  usedLabels: readonly string[];
  priceError?: string;
}>();
const emit = defineEmits<{ cancel: []; save: [choice: PriceChoiceDraft] }>();
const open = defineModel<boolean>("open", { required: true });
const draft = shallowRef<PriceChoiceDraft>({ ...props.choice });
const errors = shallowRef<Partial<Record<"price" | "portionLabel", string>>>(
  {},
);
const serverPriceEdited = shallowRef(false);

function validPrice(value: string): boolean {
  return /^\d+$/.test(value);
}
function save(): void {
  if (props.disabled) return;
  errors.value = {
    ...(validPrice(draft.value.price)
      ? {}
      : { price: "Укажите цену в целых рублях" }),
    ...(!props.requiredLabel || draft.value.portionLabel.trim()
      ? {}
      : { portionLabel: "Выберите порцию или размер" }),
    ...(draft.value.portionLabel.trim() &&
    props.usedLabels.some(
      (label) =>
        normalizeLabel(label) === normalizeLabel(draft.value.portionLabel),
    )
      ? { portionLabel: "Такой размер уже добавлен" }
      : {}),
  };
  if (Object.keys(errors.value).length) return;
  emit("save", {
    ...draft.value,
    portionLabel: draft.value.portionLabel.trim(),
  });
}
function updatePrice(value: string): void {
  draft.value = { ...draft.value, price: value };
  errors.value = { ...errors.value, price: undefined };
  serverPriceEdited.value = true;
}
function updatePortionLabel(value: string): void {
  draft.value = { ...draft.value, portionLabel: value };
  errors.value = { ...errors.value, portionLabel: undefined };
}
function updateOpen(value: boolean): void {
  open.value = value;
}
watch(open, (isOpen) => {
  if (isOpen) {
    draft.value = { ...props.choice };
    errors.value = {};
    serverPriceEdited.value = false;
  }
});
function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
}
</script>

<style scoped lang="scss">
.price-choice-dialog {
  display: grid;
  gap: var(--expressa-space-md);
}
</style>
