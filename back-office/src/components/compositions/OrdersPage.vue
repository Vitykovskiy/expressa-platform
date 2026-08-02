<template>
  <section class="page">
    <h1>Очередь заказов</h1>
    <OrderQueueList
      :orders="orders"
      :loading="loading"
      :error="error"
      @open="emit('open-order', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import OrderQueueList from "../domain-ui/Orders/OrderQueueList.vue";
import type { QueueOrder } from "../domain-ui/Orders/OrderQueueCard.vue";

withDefaults(
  defineProps<{ orders: QueueOrder[]; loading?: boolean; error?: string }>(),
  { loading: false, error: "" },
);
const emit = defineEmits<{ "open-order": [id: string] }>();
</script>

<style scoped>
.page {
  display: grid;
  gap: var(--expressa-space-4);
}
h1 {
  margin: 0;
}
</style>
