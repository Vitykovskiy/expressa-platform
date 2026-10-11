<template>
  <form class="otp-form" @submit.prevent="submit">
    <h1 class="otp-form__title">Вход сотрудника</h1>
    <template v-if="requestedPhone === null">
      <UiTextField
        id="staff-phone"
        :model-value="phone"
        label="Телефон"
        inputmode="tel"
        autocomplete="tel"
        :error="phoneError"
        :disabled="busy"
        @update:model-value="emit('phone', $event)"
      />
      <UiButton
        type="submit"
        variant="primary"
        :loading="busy"
        :disabled="sendingDisabled"
        >Получить код</UiButton
      >
      <p v-if="cooldown > 0" class="otp-form__secondary">
        Повторный запрос через {{ cooldown }} с
      </p>
    </template>
    <template v-else>
      <div class="otp-form__phone">
        <span>{{ requestedPhone }}</span>
        <UiButton
          variant="quiet"
          :disabled="busy"
          @activate="emit('changePhone')"
          >Изменить номер</UiButton
        >
      </div>
      <UiTextField
        id="staff-code"
        :model-value="code"
        label="Код из сообщения"
        inputmode="numeric"
        autocomplete="one-time-code"
        :maxlength="otpLength"
        :error="codeError"
        :disabled="busy"
        @update:model-value="emit('code', $event)"
      />
      <UiButton
        type="submit"
        variant="primary"
        :loading="busy"
        :disabled="verifyCooldown > 0"
        >{{
          verifyCooldown > 0 ? `Войти через ${verifyCooldown} с` : "Войти"
        }}</UiButton
      >
      <UiButton
        variant="quiet"
        :disabled="sendingDisabled"
        @activate="emit('send')"
        >{{ resendLabel }}</UiButton
      >
    </template>
    <p v-if="error" class="otp-form__error" role="alert">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import { otpLength } from "./otp.constants";
import type { OtpFormEmits, OtpFormProps } from "./OtpForm.types";

const props = defineProps<OtpFormProps>();
const emit = defineEmits<OtpFormEmits>();
const sendingDisabled = computed(() => props.busy || props.cooldown > 0);
const resendLabel = computed(() =>
  props.cooldown > 0
    ? `Отправить ещё раз через ${props.cooldown} с`
    : "Отправить ещё раз",
);

function submit() {
  if (props.requestedPhone === null) {
    emit("send");
  } else {
    emit("verify");
  }
}
</script>

<style scoped>
.otp-form {
  display: grid;
  gap: var(--space-lg);
  max-inline-size: 24rem; /* U02's one-form working width, local geometry. */
  margin-inline: auto;
  padding-block: var(--space-xxl);
}
.otp-form__title {
  font-size: var(--font-page-title);
  line-height: var(--line-page-title);
  letter-spacing: var(--tracking-page-title);
}
.otp-form__phone {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  overflow-wrap: anywhere;
}
.otp-form__secondary {
  color: var(--color-foreground-muted);
}
.otp-form__error {
  color: var(--color-danger);
}
</style>
