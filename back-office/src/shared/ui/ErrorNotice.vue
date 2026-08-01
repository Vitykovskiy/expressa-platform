<script setup lang="ts">
import { VAlert, VBtn } from 'vuetify/components'

import type { ScreenError } from './screen-error'

defineProps<{
  error: ScreenError
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <VAlert
    class="error-notice mb-6"
    type="error"
    title="Не удалось выполнить запрос"
  >
    <p class="error-notice-message">
      {{ error.message }}
    </p>
    <p
      v-if="error.requestId !== null"
      class="error-notice-request-id"
    >
      Номер запроса: {{ error.requestId }}
    </p>
    <VBtn
      variant="text"
      @click="emit('close')"
    >
      Закрыть
    </VBtn>
  </VAlert>
</template>

<style scoped>
.error-notice-message,
.error-notice-request-id {
  margin: 0 0 0.5rem;
}
</style>
