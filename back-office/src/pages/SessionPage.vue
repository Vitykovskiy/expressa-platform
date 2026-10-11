<template>
  <main class="session-page">
    <OtpForm
      v-if="session.status === 'anonymous'"
      :phone="otp.phoneDraft"
      :code="otp.codeDraft"
      :requested-phone="otp.requestedPhone"
      :phone-error="otp.phoneError"
      :code-error="otp.codeError"
      :error="otp.error"
      :busy="session.busy"
      :cooldown="otp.cooldown"
      :verify-cooldown="otp.verifyCooldown"
      @phone="otp.updatePhone"
      @code="otp.updateCode"
      @send="sendCode"
      @verify="verifyCode"
      @change-phone="changePhone"
    />
    <section v-else class="session-page__state" aria-live="polite">
      <p v-if="session.status === 'restoring'" role="status">Проверяем сеанс</p>
      <template v-else-if="session.status === 'denied'">
        <h1 class="session-page__title">Доступ сотрудника недоступен</h1>
        <UiButton
          variant="secondary"
          :loading="session.busy"
          @activate="session.logout()"
          >Войти с другим номером</UiButton
        >
        <p v-if="session.error" class="session-page__error">
          {{ session.error }}
        </p>
      </template>
      <template v-else>
        <h1 class="session-page__title">Не удалось проверить сеанс</h1>
        <p v-if="distinctError" class="session-page__error">
          {{ session.error }}
        </p>
        <UiButton
          variant="secondary"
          :loading="session.busy"
          @activate="session.restore"
          >Проверить сеанс</UiButton
        >
        <UiButton
          variant="quiet"
          :loading="session.busy"
          @activate="session.logout()"
          >Войти с другим номером</UiButton
        >
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted } from "vue";
import OtpForm from "../features/auth/OtpForm.vue";
import { useOtpStore } from "../features/auth/otp.store";
import { otpClockMs } from "../features/auth/otp.constants";
import { useSessionStore } from "../entities/session/session.store";
import UiButton from "../shared/ui/UiButton/UiButton.vue";

const session = useSessionStore();
const otp = useOtpStore();
const distinctError = computed(
  () => session.error !== "" && session.error !== "Не удалось проверить сеанс",
);
let clock: ReturnType<typeof setInterval> | null = null;

async function sendCode() {
  const showCode = await otp.send();

  await nextTick();

  if (otp.phoneError) {
    document.getElementById("staff-phone")?.focus();
  } else if (showCode) {
    document.getElementById("staff-code")?.focus();
  }
}

async function verifyCode() {
  await otp.verify();
  await nextTick();

  if (otp.codeError) {
    document.getElementById("staff-code")?.focus();
  }
}

async function changePhone() {
  otp.changePhone();

  await nextTick();
  document.getElementById("staff-phone")?.focus();
}

onMounted(() => {
  clock = setInterval(otp.tick, otpClockMs);
});
onUnmounted(() => {
  if (clock !== null) {
    clearInterval(clock);
  }
});
</script>

<style scoped>
.session-page {
  inline-size: 100%;
}
.session-page__state {
  display: grid;
  justify-items: start;
  gap: var(--space-lg);
  padding-block: var(--space-xxl);
}
.session-page__title {
  font-size: var(--font-page-title);
  line-height: var(--line-page-title);
}
.session-page__error {
  color: var(--color-danger);
}
</style>
