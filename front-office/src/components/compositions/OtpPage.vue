<template>
  <main class="page">
    <h1>Введите код</h1>
    <p>Код отправлен на {{ phone }}.</p>
    <form class="form" @submit.prevent="submit">
      <OtpInput v-model="code" :error="error" :loading="loading" />
      <UiButton :disabled="code.length !== 6 || loading" @click="submit"
        >Подтвердить</UiButton
      >
    </form>
  </main>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import OtpInput from "../../shared/ui/OtpInput.vue";
import UiButton from "../../shared/ui/UiButton.vue";
const props = withDefaults(
  defineProps<{ phone: string; error?: string; loading?: boolean }>(),
  { error: "", loading: false },
);
const emit = defineEmits<{ submit: [code: string] }>();
const code = shallowRef("");
function submit(): void {
  if (code.value.length === 6 && !props.loading) emit("submit", code.value);
}
</script>

<style scoped>
.page,
.form {
  display: grid;
  gap: var(--fo-space-3);
}
.page {
  min-height: 100%;
  padding: var(--fo-space-4);
  background: var(--fo-surface-muted);
  color: var(--fo-text);
  font: 400 1rem/1.3 var(--fo-font);
}
.page h1,
.page p {
  margin: 0;
}
.page h1 {
  font-size: 1.5rem;
}
.page p {
  color: var(--fo-muted);
  overflow-wrap: anywhere;
}
</style>
