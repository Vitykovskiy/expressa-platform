<template>
  <VAlert
    class="error-notice"
    role="alert"
    type="error"
    title="Не удалось выполнить запрос"
  >
    <p class="error-notice-message">
      {{ error.message }}
    </p>
    <!-- Vue lint requires one attribute per line; prettier-ignore preserves it. -->
    <!-- prettier-ignore -->
    <p
      v-if="error.requestId !== null"
      class="error-notice-request-id"
    >
      Номер запроса: {{ error.requestId }}
    </p>
    <!-- Vue lint requires one attribute per line; prettier-ignore preserves it. -->
    <!-- prettier-ignore -->
    <VBtn
      class="error-notice-close"
      variant="text"
      @click="emit('close')"
    >
      Закрыть
    </VBtn>
  </VAlert>
</template>

<script setup lang="ts">
import { VAlert, VBtn } from "vuetify/components";

import type { ScreenError } from "./screen-error";

defineProps<{
  error: ScreenError;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.error-notice {
  margin-bottom: var(--expressa-space-6);
}

.error-notice-message,
.error-notice-request-id {
  margin: 0 0 var(--expressa-space-2);
  overflow-wrap: anywhere;
}

.error-notice-close {
  min-height: var(--expressa-touch-target-min);
}

.error-notice-close:focus-visible {
  outline: var(--expressa-focus-outline);
  outline-offset: var(--expressa-focus-offset);
}
</style>
