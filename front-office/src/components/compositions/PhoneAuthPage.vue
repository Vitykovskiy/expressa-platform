<template>
  <main class="page">
    <h1>Вход по телефону</h1>
    <p>Отправим код в сообщении.</p>
    <form class="form" @submit.prevent="submit">
      <PhoneField
        v-model="phone"
        :error="error"
        :loading="loading"
        autocomplete="tel"
      />
      <UiButton :disabled="!isComplete || loading" @click="submit"
        >Получить код</UiButton
      >
    </form>
  </main>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import PhoneField from "../../shared/ui/PhoneField.vue";
import UiButton from "../../shared/ui/UiButton.vue";
const props = withDefaults(
  defineProps<{ error?: string; loading?: boolean }>(),
  { error: "", loading: false },
);
const emit = defineEmits<{ submit: [phone: string] }>();
const phone = shallowRef("");
const isComplete = computed(() => phone.value.replace(/\D/g, "").length >= 11);
function submit(): void {
  if (isComplete.value && !props.loading) emit("submit", phone.value);
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
}
</style>
