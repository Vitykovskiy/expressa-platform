<template>
  <section class="page">
    <h1>Детали заказа</h1>
    <Skeleton v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="emit('retry')" />
    <EmptyState
      v-else-if="!order"
      title="Заказ не найден"
      message="Вернитесь к очереди и выберите другой заказ."
    />
    <template v-else>
      <OrderDetailsPanel :order="order" />
      <OrderActionBar
        :status="status"
        :loading="working"
        @advance="emit('advance', $event)"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import EmptyState from "../domain-ui/Feedback/EmptyState.vue";
import ErrorState from "../domain-ui/Feedback/ErrorState.vue";
import Skeleton from "../domain-ui/Feedback/Skeleton.vue";
import OrderActionBar from "../domain-ui/Orders/OrderActionBar.vue";
import OrderDetailsPanel from "../domain-ui/Orders/OrderDetailsPanel.vue";
import type { OrderEvent } from "../domain-ui/Orders/EventTimeline.vue";
import type { OrderStatus } from "../domain-ui/Orders/OrderQueueCard.vue";

export interface OrderDetails {
  number: string;
  customer: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
  snapshot: { id: string; name: string; quantity: number; price: number }[];
  events: OrderEvent[];
}
const props = withDefaults(
  defineProps<{
    order?: OrderDetails;
    loading?: boolean;
    error?: string;
    working?: boolean;
  }>(),
  { order: undefined, loading: false, error: "", working: false },
);
const emit = defineEmits<{ advance: [status: OrderStatus]; retry: [] }>();
const status = computed(() => props.order?.status ?? "issued");
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
