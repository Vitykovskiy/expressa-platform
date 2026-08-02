<template>
  <section class="auth-gate-prompt" aria-labelledby="auth-gate-prompt-title">
    <LockKeyhole class="auth-gate-prompt__icon" aria-hidden="true" />
    <div>
      <h1 id="auth-gate-prompt-title" class="auth-gate-prompt__title">
        {{ props.title }}
      </h1>
      <p class="auth-gate-prompt__description">
        {{ props.message }}
      </p>
    </div>
    <p class="auth-gate-prompt__note">
      {{ props.note }}
    </p>
    <ui-btn
      block
      class="auth-gate-prompt__button"
      color="surface"
      size="x-large"
      @click="emit('confirm')"
    >
      {{ props.confirmLabel }}
    </ui-btn>
  </section>
</template>

<script setup lang="ts">
import { LockKeyhole } from "lucide-vue-next";
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import type {
  AuthGatePromptEmits,
  AuthGatePromptProps,
} from "./AuthGatePrompt.types";

const props = defineProps<AuthGatePromptProps>();
const emit = defineEmits<AuthGatePromptEmits>();
</script>

<style scoped lang="scss">
.auth-gate-prompt {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: var(--customer-size-content-auth);
  gap: var(--customer-space-13);
  margin: 0 auto;
  padding: var(--customer-space-17) var(--customer-space-9);
  text-align: center;
}

.auth-gate-prompt__icon {
  width: var(--customer-font-size-state);
  height: var(--customer-font-size-state);
  padding: var(--customer-space-14);
  color: var(--customer-background);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-round);
  box-shadow: var(--customer-shadow-floating);
}

.auth-gate-prompt__title {
  margin: 0 0 var(--customer-space-5);
  font-size: var(--customer-font-size-6xl);
  font-weight: var(--customer-font-weight-black);
}

.auth-gate-prompt__description,
.auth-gate-prompt__note {
  margin: 0;
  color: var(--customer-text-muted-on-brand);
  font-size: var(--customer-font-size-body);
  font-weight: var(--customer-font-weight-semibold);
  line-height: var(--customer-line-height-relaxed);
}

.auth-gate-prompt__note {
  width: 100%;
  padding: var(--customer-space-9) var(--customer-space-11);
  background: var(--customer-surface-note);
  border-radius: var(--customer-radius);
}

.auth-gate-prompt__button {
  flex: 0 0 auto;
  color: var(--customer-background);
  font-weight: var(--customer-font-weight-black);
}
</style>
