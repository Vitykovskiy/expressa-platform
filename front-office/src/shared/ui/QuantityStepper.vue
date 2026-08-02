<template>
  <div class="stepper" aria-label="Количество">
    <button
      class="stepper-button"
      type="button"
      aria-label="Уменьшить количество"
      :disabled="!canDecrease"
      @click="decrease"
    >
      −
    </button>
    <output class="stepper-value" aria-live="polite">{{ model }}</output>
    <button
      class="stepper-button"
      type="button"
      aria-label="Увеличить количество"
      :disabled="!canIncrease"
      @click="increase"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ disabled?: boolean; max?: number; min?: number }>(),
  { disabled: false, max: 20, min: 1 },
);
const model = defineModel<number>({ default: 1 });
const canDecrease = computed(() => !props.disabled && model.value > props.min);
const canIncrease = computed(() => !props.disabled && model.value < props.max);

function decrease(): void {
  if (canDecrease.value) model.value -= 1;
}

function increase(): void {
  if (canIncrease.value) model.value += 1;
}
</script>

<style scoped>
.stepper {
  display: inline-grid;
  grid-template-columns: 2.75rem 3rem 2.75rem;
  align-items: center;
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  overflow: hidden;
  background: var(--fo-surface);
}
.stepper-button {
  min-height: 2.75rem;
  border: 0;
  color: var(--fo-brand-dark);
  background: transparent;
  font: 700 1.25rem/1 var(--fo-font);
  cursor: pointer;
}
.stepper-button:disabled {
  color: var(--fo-muted);
  background: var(--fo-surface-muted);
  cursor: not-allowed;
}
.stepper-value {
  color: var(--fo-text);
  text-align: center;
  font: 700 1rem/1 var(--fo-font);
}
</style>
