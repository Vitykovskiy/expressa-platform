<template>
  <ol class="timeline" aria-label="История заказа">
    <li v-for="event in events" :key="event.id">
      <strong>{{ labels[event.from] }} — {{ labels[event.to] }}</strong
      ><span>{{ event.author }}, {{ event.at }}</span>
    </li>
  </ol>
</template>
<script setup lang="ts">
import type { OrderStatus } from "./OrderQueueCard.vue";
export interface OrderEvent {
  id: string;
  from: OrderStatus;
  to: OrderStatus;
  author: string;
  at: string;
}
defineProps<{ events: OrderEvent[] }>();
const labels: Record<OrderStatus, string> = {
  created: "Оформлен",
  accepted: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  issued: "Выдан",
};
</script>
<style scoped>
.timeline {
  display: grid;
  gap: var(--expressa-space-2);
  padding-left: var(--expressa-space-6);
}
.timeline span {
  display: block;
  opacity: var(--expressa-text-muted-opacity);
}
</style>
