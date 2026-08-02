<template>
  <button class="order-card" type="button" @click="emit('open', order.id)">
    <strong>Заказ №{{ order.number }}</strong
    ><span>{{ order.createdAt }}</span> <span>{{ order.total }} ₽</span
    ><OrderStatusBadge :status="order.status" />
  </button>
</template>
<script setup lang="ts">
import OrderStatusBadge from "../../../shared/ui/OrderStatusBadge.vue";
export type OrderStatus =
  "created" | "accepted" | "preparing" | "ready" | "issued";
export interface QueueOrder {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
}
defineProps<{ order: QueueOrder }>();
const emit = defineEmits<{ open: [id: string] }>();
</script>
<style scoped>
.order-card {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: var(--expressa-space-2);
  width: 100%;
  min-height: var(--expressa-touch-target-min);
  padding: var(--expressa-space-2);
  text-align: left;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: var(--expressa-radius-control);
  background: rgb(var(--v-theme-surface));
  color: inherit;
  cursor: pointer;
}
@media (max-width: 479px) {
  .order-card {
    grid-template-columns: 1fr auto;
  }
}
</style>
