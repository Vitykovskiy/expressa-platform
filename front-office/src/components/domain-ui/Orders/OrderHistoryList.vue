<template>
  <section class="history" aria-label="История заказов">
    <p v-if="loading" role="status">Загружаем историю…</p>
    <p v-else-if="error" role="alert">{{ error }}</p>
    <p v-else-if="isEmpty" role="status">Заказов пока нет.</p>
    <template v-else
      ><OrderCard
        v-for="order in orders"
        :key="order.number"
        v-bind="order"
        @open="emit('open', order.number)"
        @repeat="emit('repeat', order.number)"
    /></template>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import OrderCard from "./OrderCard.vue";
defineOptions({ name: "FoOrderHistoryList" });
type Stage = "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
interface Order {
  number: string;
  date: string;
  stage: Stage;
  total: number;
}
const props = withDefaults(
  defineProps<{
    orders: readonly Order[];
    loading?: boolean;
    error?: string;
  }>(),
  { loading: false, error: undefined },
);
const emit = defineEmits<{
  open: [number: string];
  repeat: [number: string];
}>();
const isEmpty = computed(() => props.orders.length === 0);
</script>
<style scoped>
.history {
  display: grid;
  gap: var(--fo-space-3);
  font: 400 1rem/1.3 var(--fo-font);
}
.history p {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
