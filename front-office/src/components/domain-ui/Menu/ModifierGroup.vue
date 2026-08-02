<template>
  <fieldset class="modifier-group">
    <legend class="modifier-group-title">
      {{ title }}
      <small class="modifier-group-limits">{{ min }}–{{ max }}</small>
    </legend>
    <label v-for="option in options" :key="option.id" class="modifier-option">
      <input
        class="modifier-option-input"
        type="checkbox"
        :checked="modelValue.includes(option.id)"
        :disabled="isOptionDisabled(option.id)"
        @change="toggle(option.id)"
      />
      <span class="modifier-option-label">{{ option.label }}</span>
      <small v-if="option.price" class="modifier-option-price">
        +{{ option.price }} ₽
      </small>
    </label>
  </fieldset>
</template>

<script setup lang="ts">
interface ModifierOption {
  id: string;
  label: string;
  price?: number;
}

const props = defineProps<{
  title: string;
  options: readonly ModifierOption[];
  modelValue: string[];
  min: number;
  max: number;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

function isOptionDisabled(id: string): boolean {
  const selected = props.modelValue.includes(id);
  return selected
    ? props.modelValue.length <= props.min
    : props.modelValue.length >= props.max;
}

function toggle(id: string): void {
  if (isOptionDisabled(id)) return;

  const selected = props.modelValue.includes(id);
  const nextValue = selected
    ? props.modelValue.filter((value) => value !== id)
    : [...props.modelValue, id];
  emit("update:modelValue", nextValue);
}
</script>

<style scoped>
.modifier-group {
  display: grid;
  gap: var(--fo-space-2);
  margin: 0;
  padding: var(--fo-space-3);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  font: 400 1rem/1.2 var(--fo-font);
}

.modifier-group-title {
  padding: 0 var(--fo-space-1);
  font-weight: 700;
}

.modifier-group-limits,
.modifier-option-price {
  color: var(--fo-muted);
}

.modifier-option {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: var(--fo-space-2);
  cursor: pointer;
}

.modifier-option-input {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  accent-color: var(--fo-brand);
}

.modifier-option-input:disabled {
  cursor: not-allowed;
}

.modifier-option-price {
  margin-left: auto;
  white-space: nowrap;
}
</style>
