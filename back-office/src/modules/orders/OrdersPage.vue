<template>
  <main ref="desktopScroll" class="orders-page">
    <header class="orders-page__header">
      <h1 ref="heading" class="orders-page__heading" tabindex="-1">Заказы</h1>
      <button
        class="orders-page__refresh"
        type="button"
        aria-label="Обновить заказы"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <img :src="ORDER_REFRESH_ICON" alt="" />
      </button>
    </header>
    <div ref="mobileScroll" class="orders-page__scroll">
      <OperationsTabs
        class="orders-page__filters"
        :options="ORDER_FILTER_OPTIONS"
        :model-value="props.filter"
        label="Стадии заказов"
        @update:model-value="selectFilter"
      />
      <div class="orders-page__content" :aria-busy="loading">
        <slot name="feedback" />
        <p v-if="showInitialLoading" class="orders-page__message" role="status">
          Загружаем заказы…
        </p>
        <p
          v-if="props.phase === 'error'"
          class="orders-page__message orders-page__message--error"
          role="alert"
        >
          {{ props.errorMessage }}
        </p>
        <OrderCard
          v-if="props.selectedOrder"
          class="orders-page__selected"
          :order="props.selectedOrder"
          :disabled="props.commandsDisabled"
          :pending="props.selectedOrder.id === props.pendingOrderId"
          expanded
          @confirm="emit('confirm', $event)"
          @reject="emit('reject', $event)"
          @ready="emit('ready', $event)"
          @issue="emit('issue', $event)"
          @toggle-details="emit('toggleDetails', $event)"
        />
        <OperationsEmptyState
          v-if="showEmptyQueue"
          title="Заказов нет"
          description="Активные заказы появятся здесь"
        />
        <OrdersQueue
          v-else-if="props.orders.length > 0"
          :orders="props.orders"
          :disabled="queueCommandsDisabled"
          :pending-order-id="props.pendingOrderId"
          :expanded-order-id="props.expandedOrderId"
          @confirm="emit('confirm', $event)"
          @reject="emit('reject', $event)"
          @ready="emit('ready', $event)"
          @issue="emit('issue', $event)"
          @toggle-details="emit('toggleDetails', $event)"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import OperationsTabs from "../../shared/ui/operations/OperationsTabs.vue";
import OperationsEmptyState from "../../shared/ui/operations/OperationsEmptyState.vue";
import OrdersQueue from "./components/OrdersQueue.vue";
import OrderCard from "./components/OrderCard.vue";
import {
  ORDER_FILTER_OPTIONS,
  ORDER_REFRESH_ICON,
  ORDER_MOBILE_QUERY,
} from "./OrdersPage.constants";
import type {
  OrdersPageProps,
  OrdersPageEmits,
  OrdersPageSlots,
} from "./OrdersPage.types";

const props = defineProps<OrdersPageProps>();
const emit = defineEmits<OrdersPageEmits>();

defineSlots<OrdersPageSlots>();

const desktopScroll = useTemplateRef<globalThis.HTMLElement>("desktopScroll");
const mobileScroll = useTemplateRef<globalThis.HTMLElement>("mobileScroll");
const heading = useTemplateRef<globalThis.HTMLHeadingElement>("heading");

const loading = computed(() => props.phase === "loading");

const showInitialLoading = computed(
  () => loading.value && props.orders.length === 0,
);

const showEmptyQueue = computed(
  () =>
    props.phase === "ready" &&
    props.orders.length === 0 &&
    props.selectedOrder === null,
);

const queueCommandsDisabled = computed(
  () => props.commandsDisabled || props.phase !== "ready",
);

function activeScrollElement() {
  return globalThis.matchMedia(ORDER_MOBILE_QUERY).matches
    ? mobileScroll.value
    : desktopScroll.value;
}

function captureScroll() {
  const surface = activeScrollElement();

  return surface?.scrollTop ?? 0;
}

function restoreScroll(position: number) {
  const surface = activeScrollElement();

  if (surface !== null) {
    surface.scrollTop = position;
  }
}

function focusHeading() {
  heading.value?.focus({ preventScroll: true });
}

function selectFilter(value: string) {
  const option = ORDER_FILTER_OPTIONS.find(
    (candidate) => candidate.id === value,
  );

  if (option) {
    emit("selectFilter", option.id);
  }
}

defineExpose({ captureScroll, restoreScroll, focusHeading });
</script>

<style scoped>
/* Страница владеет геометрией и типографикой; общей шкалы в tokens нет. */
.orders-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100dvh;
  padding: 24px;
  overflow: auto;
  background: var(--color-surface);
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
}
.orders-page__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
}
.orders-page__heading {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  outline: none;
}
.orders-page__refresh {
  display: none;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.orders-page__refresh:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
.orders-page__scroll {
  min-width: 0;
}
.orders-page__content {
  padding-top: 16px;
}
.orders-page__selected {
  margin-bottom: 16px;
}
.orders-page__message {
  margin: 0;
  padding: 48px 24px;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}
.orders-page__message--error {
  color: var(--color-danger);
}
@media (max-width: 767px) {
  /* На узком экране прокручивается внутренний блок под шапкой и навигацией. */
  .orders-page {
    height: calc(100dvh - 60px);
    padding: 0;
    overflow: hidden;
    background: var(--color-background);
  }
  .orders-page__header {
    flex-basis: 52px;
    padding: 0 16px;
    background: var(--color-surface);
  }
  .orders-page__heading {
    font-size: 18px;
    font-weight: 600;
    line-height: 28px;
  }
  .orders-page__refresh {
    display: inline-flex;
  }
  .orders-page__scroll {
    flex: 1;
    overflow: auto;
  }
  .orders-page__filters {
    padding-inline: 16px;
  }
  .orders-page__content {
    padding: 16px;
  }
}
</style>
