<template>
  <!-- prettier-ignore -->
  <VAlert
    v-if="error"
    v-bind="attrs"
    class="error-notice mb-6"
    type="error"
    title="Не удалось выполнить запрос"
  >
    <p class="error-notice-message">
      {{ error.message }}
    </p>
    <!-- prettier-ignore -->
    <p
      v-if="error.requestId"
      class="error-notice-request-id"
    >
      Номер запроса: {{ error.requestId }}
    </p>
    <!-- prettier-ignore -->
    <VBtn
      variant="text"
      @click="emit('close')"
    >
      Закрыть
    </VBtn>
  </VAlert>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { VAlert, VBtn } from "vuetify/components";

import type { ScreenError } from "./screen-error";

defineOptions({ inheritAttrs: false });

defineProps<{
  error: ScreenError | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const attrs = useAttrs();
</script>

<style scoped>
.error-notice-message,
.error-notice-request-id {
  overflow-wrap: anywhere;
  margin: 0 0 0.5rem;
}
</style>
