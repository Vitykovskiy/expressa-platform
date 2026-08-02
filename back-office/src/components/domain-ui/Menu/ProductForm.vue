<template>
  <form @submit.prevent="submit">
    <UiTextField
      v-model="draft.name"
      label="Название товара"
      :error-message="errors.name"
      @update:model-value="errors.name = ''"
    /><label
      >Тип
      <select v-model="draft.kind">
        <option value="drink">Напиток</option>
        <option value="single">Товар с одной ценой</option>
      </select></label
    ><VariantEditor
      v-if="draft.kind === 'drink'"
      v-model="draft.variants"
      @validity-change="variantPriceInvalid = $event"
    /><UiTextField
      v-else
      v-model="draft.price"
      label="Цена"
      inputmode="numeric"
      :error-message="errors.price"
      @update:model-value="errors.price = ''"
    /><FormErrors :errors="errors" /><UiButton type="submit"
      >Сохранить товар</UiButton
    >
  </form>
</template>
<script setup lang="ts">
import { reactive, shallowRef } from "vue";
import UiButton from "../../../shared/ui/UiButton.vue";
import UiTextField from "../../../shared/ui/UiTextField.vue";
import FormErrors from "../Feedback/FormErrors.vue";
import VariantEditor, { type DrinkSize } from "./VariantEditor.vue";
export interface Draft {
  name: string;
  kind: "drink" | "single";
  price: string;
  variants: Partial<Record<DrinkSize, number>>;
}
const props = defineProps<{
  initial: Draft;
  serverErrors?: Record<string, string>;
}>();
const emit = defineEmits<{ save: [value: Draft] }>();
const draft = reactive<Draft>({
  ...props.initial,
  variants: { ...props.initial.variants },
});
const errors = reactive({ ...props.serverErrors } as Record<string, string>);
const variantPriceInvalid = shallowRef(false);
function submit() {
  errors.name = draft.name.trim() ? "" : "Название обязательно";
  errors.price =
    draft.kind === "single" && (!draft.price || Number(draft.price) < 0)
      ? "Укажите цену"
      : "";
  if (
    draft.kind === "drink" &&
    (Object.keys(draft.variants).length === 0 || variantPriceInvalid.value)
  )
    errors.variants = "Выберите размер с ценой";
  else errors.variants = "";
  if (!Object.values(errors).some(Boolean))
    emit("save", { ...draft, variants: { ...draft.variants } });
}
</script>
<style scoped>
form {
  display: grid;
  gap: var(--expressa-space-2);
}
select {
  min-height: var(--expressa-touch-target-min);
}
</style>
