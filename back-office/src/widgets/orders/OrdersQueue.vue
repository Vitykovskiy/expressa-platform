<template>
  <div class="orders-queue">
    <OrderCard
      v-for="order in props.orders"
      :key="order.id"
      :order="order"
      :disabled="props.disabled"
      :pending="order.id === props.pendingOrderId"
      :expanded="order.id === props.expandedOrderId"
      @confirm="emit('confirm', $event)"
      @reject="emit('reject', $event)"
      @ready="emit('ready', $event)"
      @issue="emit('issue', $event)"
      @toggle-details="emit('toggleDetails', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import OrderCard from "../../features/orders/ui/OrderCard.vue";
import type { OrdersQueueProps, OrdersQueueEmits } from "./OrdersQueue.types";

const props = defineProps<OrdersQueueProps>();
const emit = defineEmits<OrdersQueueEmits>();
</script>

<style scoped>
/* Очередь владеет сеткой: tokens не задают её интервал или порог двух колонок. */
.orders-queue {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 16px;
}
@media (min-width: 1024px) {
  .orders-queue {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
