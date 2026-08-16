<template>
  <section
    class="orders-history"
    aria-labelledby="orders-history-title"
    :aria-busy="props.loading"
  >
    <h1 id="orders-history-title">История заказов</h1>
    <p v-if="props.loading && props.orders.length === 0" role="status">
      Загружаем историю заказов
    </p>
    <div v-else-if="props.errorMessage" role="alert">
      <p>{{ props.errorMessage }}</p>
      <ui-btn type="button" @click="emit('retry')">Повторить</ui-btn>
    </div>
    <p v-else-if="props.orders.length === 0" role="status">
      История заказов пуста
    </p>
    <template v-else>
      <ul aria-label="История заказов">
        <li v-for="order in props.orders" :key="order.id">
          <OrderCard
            :order="order"
            :stage-label="orderCardStageLabels[order.stage]"
          />
        </li>
      </ul>
      <ui-btn
        v-if="props.hasMore"
        type="button"
        :loading="props.loading"
        @click="emit('loadMore')"
        >Показать ещё</ui-btn
      >
    </template>
  </section>
</template>

<script setup lang="ts">
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import OrderCard from "./OrderCard.vue";
import { orderCardStageLabels } from "./OrderCard.constants";
import type {
  OrdersHistoryScreenEmits,
  OrdersHistoryScreenProps,
} from "./OrdersHistoryScreen.types";

const props = defineProps<OrdersHistoryScreenProps>();
const emit = defineEmits<OrdersHistoryScreenEmits>();
</script>

<style scoped>
.orders-history {
  display: grid;
  gap: var(--customer-space-7);
  max-width: 48rem;
  margin: 0 auto;
  padding: var(--customer-space-9);
}
.orders-history h1,
.orders-history p {
  margin: 0;
}
.orders-history ul {
  display: grid;
  gap: var(--customer-space-5);
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>
