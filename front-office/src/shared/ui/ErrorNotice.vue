<template>
  <!-- prettier-ignore -->
  <VAlert
    v-if="error"
    v-bind="attrs"
    class="error-notice mb-6"
    type="error"
    title="Не удалось выполнить действие"
  >
    <p class="error-notice-message">
      Проверьте подключение и повторите действие.
    </p>
    <!-- prettier-ignore -->
    <VBtn
      variant="text"
      @click="emit('close')"
    >
      Понятно
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
.error-notice-message {
  overflow-wrap: anywhere;
  margin: 0 0 0.5rem;
}
</style>
