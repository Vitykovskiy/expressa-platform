<template>
  <main class="auth-screen">
    <LoadingState v-if="props.state === 'loading'" />
    <section v-else-if="props.state === 'denied'" class="auth-screen__card">
      <DeniedState @retry="emit('retry')" />
    </section>
    <p
      v-else-if="props.state === 'success'"
      class="auth-screen__success"
      role="status"
    >
      Вход выполнен
    </p>
    <section v-else class="auth-screen__card">
      <header class="auth-screen__header">
        <p>Expressa Admin</p>
        <h1>{{ presentation.title }}</h1>
      </header>
      <PhoneStep
        v-if="props.state === 'phone'"
        :error="props.error"
        :phone="props.phone"
        :valid="props.phoneValid"
        @submit="emit('requestOtp')"
        @update:phone="emit('update:phone', $event)"
      />
      <OtpStep
        v-else
        :error="props.error"
        :expires-in-seconds="props.otpMetadata?.expiresInSeconds ?? 0"
        :otp="props.otp"
        :phone="props.phone"
        :retry-after-seconds="props.otpMetadata?.retryAfterSeconds ?? 0"
        :valid="props.otpValid"
        @change-phone="emit('changePhone')"
        @resend="emit('resendOtp')"
        @submit="emit('verifyOtp')"
        @update:otp="emit('update:otp', $event)"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AUTH_SCREEN_PRESENTATION } from "./AuthScreen.constants";
import type { AuthScreenEmits, AuthScreenProps } from "./AuthScreen.types";
import DeniedState from "./DeniedState.vue";
import LoadingState from "./LoadingState.vue";
import OtpStep from "./OtpStep.vue";
import PhoneStep from "./PhoneStep.vue";

const props = defineProps<AuthScreenProps>();
const presentation = computed(() => AUTH_SCREEN_PRESENTATION[props.state]);
const emit = defineEmits<AuthScreenEmits>();
</script>

<style scoped lang="scss">
.auth-screen {
  display: grid;
  min-height: 100dvh;
  padding: var(--expressa-space-lg);
  place-items: center;
  background: var(--expressa-color-surface-raised);
}

.auth-screen__card {
  width: min(100%, var(--expressa-size-auth-card-max-width));
  padding: var(--expressa-space-xl);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}

.auth-screen__header {
  margin-bottom: var(--expressa-space-lg);
}

.auth-screen__header p,
.auth-screen__header h1,
.auth-screen__success {
  margin: 0;
}

.auth-screen__header p {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  font-weight: var(--expressa-font-weight-medium);
}

.auth-screen__header h1 {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-heading);
  line-height: var(--expressa-line-height-tight);
}

.auth-screen__success {
  color: var(--expressa-color-status-success);
  font-size: var(--expressa-font-size-action);
  text-align: center;
}
</style>
