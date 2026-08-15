<template>
  <article class="order-card">
    <h2>Заказ №{{ props.order.number }}</h2>
    <p>{{ props.stageLabel }}</p>
    <p>{{ formatMinorAmount(props.order.totalMinor) }}</p>
    <ui-btn :to="`/orders/${props.order.id}`">Открыть заказ</ui-btn>
  </article>
</template>

<script setup lang="ts">
import { formatMinorAmount } from "@/entities/customer/model/money";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import type { OrderCardProps } from "./OrderCard.types";

const props = defineProps<OrderCardProps>();
</script>

<style scoped>
.order-card {
  display: grid;
  gap: var(--customer-space-3);
  padding: var(--customer-space-7);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
}
.order-card h2,
.order-card p {
  margin: 0;
}
</style>
