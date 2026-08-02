<template>
  <div class="queue" aria-label="Очередь заказов">
    <div class="queue-controls">
      <label
        >Стадия
        <select v-model="stage">
          <option value="all">Все ({{ orders.length }})</option>
          <option v-for="item in statuses" :key="item" :value="item">
            {{ labels[item] }} ({{ counts[item] }})
          </option>
        </select></label
      ><label
        >Номер <input v-model="query" type="search" inputmode="search"
      /></label>
    </div>
    <p v-if="loading" role="status">Загружаем очередь</p>
    <p v-else-if="error" role="alert">
      Не удалось загрузить очередь. {{ error }}
    </p>
    <p v-else-if="visibleOrders.length === 0" role="status">Заказов нет</p>
    <div v-else class="queue-list">
      <OrderQueueCard
        v-for="order in visibleOrders"
        :key="order.id"
        :order="order"
        @open="emit('open', $event)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, shallowRef } from "vue";
import OrderQueueCard, {
  type OrderStatus,
  type QueueOrder,
} from "./OrderQueueCard.vue";
const props = withDefaults(
  defineProps<{ orders: QueueOrder[]; loading?: boolean; error?: string }>(),
  { loading: false, error: "" },
);
const emit = defineEmits<{ open: [id: string] }>();
const query = shallowRef("");
const stage = shallowRef<"all" | OrderStatus>("all");
const statuses: OrderStatus[] = [
  "created",
  "accepted",
  "preparing",
  "ready",
  "issued",
];
const labels: Record<OrderStatus, string> = {
  created: "Оформлен",
  accepted: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  issued: "Выдан",
};
const counts = computed(
  () =>
    Object.fromEntries(
      statuses.map((item) => [
        item,
        props.orders.filter((order) => order.status === item).length,
      ]),
    ) as Record<OrderStatus, number>,
);
const visibleOrders = computed(() =>
  props.orders
    .filter(
      (order) =>
        (stage.value === "all" || order.status === stage.value) &&
        order.number.includes(query.value.trim()),
    )
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
);
</script>
<style scoped>
.queue-controls,
.queue-list {
  display: grid;
  gap: var(--expressa-space-2);
  margin-bottom: var(--expressa-space-4);
}
input,
select {
  min-height: var(--expressa-touch-target-min);
  margin-left: var(--expressa-space-2);
}
</style>
