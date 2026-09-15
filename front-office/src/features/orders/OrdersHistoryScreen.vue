<template>
  <section
    class="orders-history"
    aria-labelledby="orders-history-title"
    :aria-busy="props.loading"
  >
    <header class="orders-history__header">
      <div>
        <h1 id="orders-history-title">История</h1>
      </div>
      <div class="orders-history__actions">
        <ui-icon-btn
          v-if="!props.errorMessage"
          type="button"
          aria-label="Обновить историю заказов"
          :loading="props.loading"
          @click="emit('retry')"
        >
          <RefreshCw class="orders-history__refresh-icon" aria-hidden="true" />
        </ui-icon-btn>
      </div>
    </header>
    <p v-if="props.staleMessage" class="orders-history__stale" role="status">
      {{ props.staleMessage }}
    </p>
    <div
      v-if="props.loading && props.orders.length === 0"
      class="orders-history__state"
      role="status"
    >
      Загружаем историю заказов
    </div>
    <div
      v-else-if="props.errorMessage"
      class="orders-history__state orders-history__state--error"
      role="alert"
    >
      <p>{{ props.errorMessage }}</p>
      <ui-btn type="button" class="orders-history__retry" @click="emit('retry')"
        >Повторить</ui-btn
      >
    </div>
    <div
      v-else-if="props.orders.length === 0"
      class="orders-history__empty"
      role="status"
    >
      <div class="orders-history__empty-icon" aria-hidden="true">
        <History class="orders-history__empty-icon-glyph" />
      </div>
      <p class="orders-history__empty-message">История заказов пуста</p>
      <ui-btn
        class="orders-history__empty-action"
        color="surface"
        size="large"
        to="/"
        type="button"
      >
        Перейти в меню
      </ui-btn>
    </div>
    <template v-else>
      <ul class="orders-history__grid" aria-label="История заказов">
        <li v-for="order in props.orders" :key="order.id">
          <OrderCard
            :order="order"
            :stage-label="orderCardStageLabels[order.stage]"
            @repeat="emit('repeat', $event)"
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
import { History, RefreshCw } from "lucide-vue-next";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import OrderCard from "./OrderCard.vue";
import { orderCardStageLabels } from "./OrderCard.constants";
import type {
  OrdersHistoryScreenEmits,
  OrdersHistoryScreenProps,
} from "./OrdersHistoryScreen.types";

const props = defineProps<OrdersHistoryScreenProps>();
const emit = defineEmits<OrdersHistoryScreenEmits>();
</script>

<style scoped lang="scss">
.orders-history {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  color: var(--customer-text);
}
.orders-history__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--customer-space-9);
  padding: var(--customer-space-13) var(--customer-space-9)
    var(--customer-space-9);
}
.orders-history__eyebrow {
  margin: 0 0 var(--customer-space-4);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}
.orders-history__actions {
  display: flex;
  flex: 0 0 auto;
  gap: var(--customer-space-4);
}
.orders-history h1 {
  margin: 0;
  font-size: var(--customer-font-size-page-heading);
  font-weight: var(--customer-font-weight-page-heading);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-page-heading);
}
.orders-history__refresh-icon {
  width: var(--customer-font-size-md);
  height: var(--customer-font-size-md);
}
.orders-history__state {
  display: grid;
  gap: var(--customer-space-7);
  justify-items: start;
  min-width: 0;
  padding: 0 var(--customer-space-9) var(--customer-space-13);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-bold);
}
.orders-history__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--customer-space-11);
  min-width: 0;
  padding: var(--customer-space-18) var(--customer-space-9);
  text-align: center;
}
.orders-history__empty-icon {
  display: grid;
  width: calc(var(--customer-font-size-7xl) + var(--customer-space-11) * 2);
  height: calc(var(--customer-font-size-7xl) + var(--customer-space-11) * 2);
  padding: var(--customer-space-11);
  place-items: center;
  border-radius: var(--customer-radius-round);
  background: var(--customer-color-surface-subtle);
}
.orders-history__empty-icon-glyph {
  width: var(--customer-font-size-7xl);
  height: var(--customer-font-size-7xl);
  color: var(--customer-color-text-on-brand);
}
.orders-history__empty-message {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--customer-color-text-muted-on-brand);
  font-weight: var(--customer-font-weight-bold);
}
.orders-history__empty-action {
  padding: var(--customer-space-7) var(--customer-space-15);
  border-radius: var(--customer-radius-md);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
  line-height: 1.5;
}
.orders-history__stale {
  margin: 0 var(--customer-space-9) var(--customer-space-7);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}
.orders-history__state p {
  margin: 0;
  overflow-wrap: anywhere;
}
.orders-history__retry {
  min-height: 44px;
  padding: 0 var(--customer-space-9);
  color: var(--customer-color-text-on-brand);
  background: var(--customer-color-action-primary);
  border-radius: var(--customer-radius-sm);
  font-weight: var(--customer-font-weight-extrabold);
}
.orders-history__retry:focus-visible {
  outline: 2px solid var(--customer-color-focus);
  outline-offset: 2px;
}
.orders-history__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--customer-space-6);
  padding: 0;
  margin: 0;
  list-style: none;
}
.orders-history__grid > li {
  min-width: 0;
}
.orders-history > .ui-btn {
  align-self: center;
  margin: var(--customer-space-9) var(--customer-space-9)
    var(--customer-space-17);
  padding: 0 var(--customer-space-11);
  color: var(--customer-text);
  background: var(--customer-surface-muted);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-extrabold);
}
@media (max-width: 1023px) {
  .orders-history__grid {
    padding: 0 var(--customer-space-9) var(--customer-space-17);
  }
}
@media (min-width: 1024px) {
  .orders-history__header {
    padding-right: 0;
    padding-left: 0;
  }
  .orders-history__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-bottom: var(--customer-space-17);
  }
  .orders-history__state {
    padding-right: 0;
    padding-left: 0;
  }
  .orders-history__stale {
    margin-right: 0;
    margin-left: 0;
  }
}
</style>
