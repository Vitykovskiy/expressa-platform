<template>
  <fieldset
    class="otp"
    :class="{ 'otp--error': error }"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <legend class="otp-label">Код из сообщения</legend>
    <div class="otp-inputs">
      <input
        v-for="index in length"
        :key="index"
        ref="inputs"
        class="otp-input"
        :value="model[index - 1] ?? ''"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="1"
        :aria-label="`Цифра ${index}`"
        :aria-invalid="Boolean(error)"
        @input="update(index - 1, ($event.target as HTMLInputElement).value)"
        @keydown="keydown(index - 1, $event)"
      />
    </div>
    <span v-if="loading" class="otp-loading" role="status">Проверяем код…</span>
    <span v-if="error" class="otp-error">{{ error }}</span>
  </fieldset>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    error?: string;
    length?: number;
    loading?: boolean;
  }>(),
  { disabled: false, error: "", length: 6, loading: false },
);
const model = defineModel<string>({ default: "" });
const inputs = shallowRef<HTMLInputElement[]>([]);

function update(index: number, value: string): void {
  const digit = value.replace(/\D/g, "").slice(-1);
  const values = Array.from(
    { length: props.length },
    (_, position) => model.value[position] ?? "",
  );
  values[index] = digit;
  model.value = values.join("");
  if (digit) inputs.value[index + 1]?.focus();
}

function keydown(index: number, event: KeyboardEvent): void {
  if (event.key === "Backspace" && !model.value[index])
    inputs.value[index - 1]?.focus();
}
</script>

<style scoped>
.otp {
  display: grid;
  gap: var(--fo-space-2);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--fo-text);
}
.otp-label {
  padding: 0;
  font: 600 0.875rem/1.3 var(--fo-font);
}
.otp-inputs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--fo-space-2);
}
.otp-input {
  min-width: 0;
  height: 3rem;
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-sm);
  color: var(--fo-text);
  background: var(--fo-surface);
  text-align: center;
  font: 700 1.25rem/1 var(--fo-font);
}
.otp--error .otp-input {
  border-color: var(--fo-danger);
}
.otp:disabled .otp-input {
  color: var(--fo-muted);
  background: var(--fo-surface-muted);
}
.otp-loading {
  color: var(--fo-muted);
  font: 400 0.8125rem/1.3 var(--fo-font);
}
.otp-error {
  color: var(--fo-danger);
  font: 400 0.8125rem/1.3 var(--fo-font);
}
</style>
