<template>
  <section class="auth-screen" :aria-busy="isLoading">
    <div class="auth-content">
      <div
        class="state-icon"
        :class="`state-icon--${presentation.iconTone}`"
        :aria-hidden="presentation.content !== 'loading'"
        :aria-live="presentation.content === 'loading' ? 'polite' : undefined"
        :role="presentation.content === 'loading' ? 'status' : undefined"
      >
        <v-progress-circular
          v-if="presentation.content === 'loading'"
          aria-label="Обрабатываем запрос..."
          class="loading-spinner"
          indeterminate
          :size="30"
          :width="3"
        />
        <component
          :is="presentation.icon"
          v-else
          class="state-icon-icon"
          aria-hidden="true"
        />
      </div>

      <header class="auth-heading">
        <h1 class="auth-title">{{ presentation.title }}</h1>
        <p class="auth-description" aria-live="polite">
          {{ presentation.description(state) }}
        </p>
      </header>

      <AuthForm
        v-if="presentation.content === 'form'"
        :state="state"
        @back-to-phone="emit('backToPhone')"
        @send-code="emit('sendCode')"
        @submit-name="emit('submitName')"
        @update-name="emit('updateName', $event)"
        @update-otp="emit('updateOtp', $event)"
        @update-phone="emit('updatePhone', $event)"
        @verify-otp="emit('verifyOtp', $event)"
      />

      <ui-btn
        v-else-if="presentation.content === 'success'"
        block
        class="auth-screen__continue-button"
        color="primary"
        :disabled="isLoading"
        size="x-large"
        @click="emit('continue')"
      >
        Продолжить
      </ui-btn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import { AUTH_SCREEN_PRESENTATION } from "./AuthScreen.constants";
import AuthForm from "./AuthForm.vue";
import type { AuthScreenEmits, AuthScreenProps } from "./AuthScreen.types";

const props = defineProps<AuthScreenProps>();

const emit = defineEmits<AuthScreenEmits>();

const presentation = computed(() => AUTH_SCREEN_PRESENTATION[props.state.step]);
const isLoading = computed(() => presentation.value.content === "loading");
</script>

<style scoped lang="scss">
.loading-spinner {
  color: var(--customer-background);
}

.auth-screen {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100dvh;
  padding: var(--customer-space-17) var(--customer-space-9);
  background: var(--customer-background);
}

.auth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: var(--customer-size-content-auth);
  gap: var(--customer-space-14);
}

.state-icon {
  display: grid;
  width: var(--customer-size-state-icon);
  height: var(--customer-size-state-icon);
  place-items: center;
  border-radius: var(--customer-radius-round);
  background: var(--customer-surface);
  box-shadow: var(--customer-shadow-state);
  color: var(--customer-background);
  font-size: var(--customer-font-size-7xl);
  font-weight: var(--customer-font-weight-black);
}

.state-icon--success {
  color: var(--customer-success);
}

.state-icon-icon {
  width: var(--customer-font-size-7xl);
  height: var(--customer-font-size-7xl);
}

.auth-heading {
  text-align: center;
}

.auth-title {
  margin: 0;
  color: var(--customer-text);
  font-size: var(--customer-font-size-6xl);
  font-weight: var(--customer-font-weight-black);
  line-height: var(--customer-line-height-tight);
}

.auth-description {
  margin: var(--customer-space-4) 0 0;
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-body);
  font-weight: var(--customer-font-weight-semibold);
  line-height: var(--customer-line-height-body);
}

.auth-screen__continue-button {
  min-height: var(--customer-size-control-xl);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
}

.state-icon--default {
  color: var(--customer-background);
}

@media (min-width: 1024px) {
  .auth-screen {
    min-height: 100dvh;
  }
}
</style>
