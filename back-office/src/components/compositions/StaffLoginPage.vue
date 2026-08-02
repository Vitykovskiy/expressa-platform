<template>
  <section class="page">
    <h1>Вход сотрудника</h1>
    <form v-if="step === 'phone'" @submit.prevent="requestCode">
      <UiTextField
        v-model="phone"
        label="Номер телефона"
        autocomplete="tel"
        inputmode="tel"
        :error-message="error"
      /><UiButton type="submit" :loading="working || waiting"
        >Получить код</UiButton
      >
    </form>
    <form v-else @submit.prevent="confirmCode">
      <UiTextField
        v-model="code"
        label="Одноразовый код"
        autocomplete="one-time-code"
        inputmode="numeric"
        :error-message="error"
      />
      <p role="status">Повторная отправка через 00:30</p>
      <UiButton type="submit" :loading="working || waiting">Войти</UiButton>
    </form>
    <p v-if="granted" role="status">
      Вход выполнен. Открыт раздел
      {{ role === "administrator" ? "администрирование" : "очередь" }}.
    </p>
  </section>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import UiButton from "../../shared/ui/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField.vue";
type StaffRole = "barista" | "administrator" | "customer";
const props = withDefaults(
  defineProps<{ role?: StaffRole; waiting?: boolean }>(),
  { role: "barista", waiting: false },
);
const emit = defineEmits<{
  authenticated: [role: Exclude<StaffRole, "customer">];
}>();
const phone = shallowRef("");
const code = shallowRef("");
const step = shallowRef<"phone" | "code">("phone");
const error = shallowRef("");
const working = shallowRef(false);
const granted = shallowRef(false);
function requestCode() {
  error.value = /^\+7\d{10}$/.test(phone.value.replace(/[\s()-]/g, ""))
    ? ""
    : "Введите российский номер в формате +7";
  if (!error.value) step.value = "code";
}
function confirmCode() {
  error.value = /^\d{6}$/.test(code.value) ? "" : "Введите шестизначный код";
  if (error.value) return;
  if (props.role === "customer") {
    error.value = "ACCESS_DENIED";
    return;
  }
  granted.value = true;
  emit("authenticated", props.role);
}
</script>

<style scoped>
.page,
form {
  display: grid;
  gap: var(--expressa-space-4);
}
h1 {
  margin: 0;
}
</style>
