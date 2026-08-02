<template>
  <article class="details">
    <h2>Заказ №{{ order.number }}</h2>
    <p>{{ order.customer }} · {{ order.createdAt }} · {{ order.total }} ₽</p>
    <h3>Снимок заказа</h3>
    <ul>
      <li v-for="line in order.snapshot" :key="line.id">
        {{ line.name }} × {{ line.quantity }} — {{ line.price }} ₽
      </li>
    </ul>
    <h3>Журнал</h3>
    <EventTimeline :events="order.events" />
  </article>
</template>
<script setup lang="ts">
import EventTimeline, { type OrderEvent } from "./EventTimeline.vue";
import type { OrderStatus } from "./OrderQueueCard.vue";
interface SnapshotLine {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
defineProps<{
  order: {
    number: string;
    customer: string;
    createdAt: string;
    total: number;
    status: OrderStatus;
    snapshot: SnapshotLine[];
    events: OrderEvent[];
  };
}>();
</script>
<style scoped>
.details {
  padding: var(--expressa-space-4);
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: var(--expressa-radius-control);
}
h2,
h3 {
  margin: 0 0 var(--expressa-space-2);
}
</style>
