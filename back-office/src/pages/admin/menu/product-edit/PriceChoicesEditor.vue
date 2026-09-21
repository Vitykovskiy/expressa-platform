<template>
  <div class="price-choices">
    <p>
      Изменения сохранятся вместе с товаром. Доступность настраивается для
      каждой цены.
    </p>
    <p v-if="!model.length">Добавьте хотя бы одну цену</p>
    <PriceChoiceRow
      v-for="(choice, index) in model"
      :key="choice.clientId"
      :choice="choice"
      :disabled="disabled"
      :errors="props.errors?.[choice.clientId]"
      :expanded="expandedId === choice.clientId"
      :first="index === 0"
      :last="index === model.length - 1"
      @toggle="
        expandedId = expandedId === choice.clientId ? null : choice.clientId
      "
      @move="move(index, $event)"
      @remove="requestRemove(index)"
      @update:price="update(index, 'price', $event)"
      @update:portion-label="update(index, 'portionLabel', $event)"
      @update:is-available="update(index, 'isAvailable', $event)"
    />
    <AdminButton
      type="button"
      variant="secondary"
      :disabled="disabled"
      @click="add"
      >Добавить цену</AdminButton
    >
    <ConfirmDialog
      v-model:open="removeOpen"
      cancel-label="Продолжить редактирование"
      confirm-label="Удалить цену"
      confirm-variant="destructive"
      description="Цена будет удалена до сохранения товара."
      title="Удалить цену?"
      @confirm="confirmRemove"
    />
  </div>
</template>
<script setup lang="ts">
import { shallowRef } from "vue";
import AdminButton from "../../../../shared/ui/admin/admin-button/AdminButton.vue";
import ConfirmDialog from "../../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import PriceChoiceRow from "./PriceChoiceRow.vue";
import { createProductPriceChoiceDraft } from "./useProductDraft";
import type { ProductPriceChoiceDraft } from "./useProductDraft.types";
const props = defineProps<{
  disabled?: boolean;
  errors?: Readonly<Record<string, { price?: string; portionLabel?: string }>>;
}>();
const model = defineModel<ProductPriceChoiceDraft[]>({ required: true });
const expandedId = shallowRef<string | null>(model.value[0]?.clientId ?? null);
const removeIndex = shallowRef<number | null>(null);
const removeOpen = shallowRef(false);
function update<K extends keyof ProductPriceChoiceDraft>(
  index: number,
  key: K,
  value: ProductPriceChoiceDraft[K],
): void {
  const choice = model.value[index];
  if (choice)
    model.value = model.value.map((item, itemIndex) =>
      itemIndex === index ? { ...choice, [key]: value } : item,
    );
}
function add(): void {
  const choice = createProductPriceChoiceDraft();
  model.value = [...model.value, choice];
  expandedId.value = choice.clientId;
}
function requestRemove(index: number): void {
  if (model.value[index]?.id) {
    removeIndex.value = index;
    removeOpen.value = true;
    return;
  }
  remove(index);
}
function confirmRemove(): void {
  if (removeIndex.value !== null) remove(removeIndex.value);
  removeIndex.value = null;
}
function remove(index: number): void {
  const removed = model.value[index];
  model.value = model.value.filter((_, itemIndex) => itemIndex !== index);
  if (removed?.clientId === expandedId.value)
    expandedId.value = model.value[0]?.clientId ?? null;
}
function move(index: number, offset: -1 | 1): void {
  const next = index + offset;
  if (!model.value[next]) return;
  const choices = [...model.value];
  [choices[index], choices[next]] = [choices[next]!, choices[index]!];
  model.value = choices;
}
</script>
