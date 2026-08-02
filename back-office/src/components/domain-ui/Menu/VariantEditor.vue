<template>
  <fieldset>
    <legend>Размеры напитка</legend>
    <label v-for="size in sizes" :key="size"
      ><input v-model="enabled[size]" type="checkbox" @change="sync" />
      {{ size }}
      <input
        v-if="enabled[size]"
        v-model="prices[size]"
        type="number"
        min="0"
        inputmode="decimal"
        :aria-label="`Цена ${size}`"
        @input="sync"
      />
      ₽</label
    >
    <p v-if="error" role="alert">{{ error }}</p>
  </fieldset>
</template>
<script setup lang="ts">
import { computed, reactive } from "vue";
export type DrinkSize = "S" | "M" | "L";
const props = defineProps<{ modelValue: Partial<Record<DrinkSize, number>> }>();
const emit = defineEmits<{
  "update:modelValue": [value: Partial<Record<DrinkSize, number>>];
  "validity-change": [invalid: boolean];
}>();
const sizes: DrinkSize[] = ["S", "M", "L"];
const enabled = reactive(
  Object.fromEntries(
    sizes.map((s) => [s, props.modelValue[s] !== undefined]),
  ) as Record<DrinkSize, boolean>,
);
const prices = reactive(
  Object.fromEntries(
    sizes.map((s) => [s, String(props.modelValue[s] ?? "")]),
  ) as Record<DrinkSize, string>,
);
const error = computed(() =>
  sizes.some((s) => enabled[s] && (!prices[s] || Number(prices[s]) < 0))
    ? "У каждого размера должна быть цена"
    : "",
);
function sync() {
  emit("validity-change", Boolean(error.value));
  emit(
    "update:modelValue",
    Object.fromEntries(
      sizes
        .filter((s) => enabled[s] && prices[s])
        .map((s) => [s, Number(prices[s])]),
    ),
  );
}
</script>
<style scoped>
fieldset,
label {
  display: grid;
  gap: var(--expressa-space-2);
  margin-bottom: var(--expressa-space-2);
}
input {
  min-height: var(--expressa-touch-target-min);
}
</style>
