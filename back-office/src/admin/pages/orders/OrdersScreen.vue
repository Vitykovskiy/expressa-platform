<template>
  <section class="orders-screen" aria-labelledby="orders-title">
    <TopBar action-label="Обновить" title="Заказы" @action="handleRefresh">
      <template #action>
        <svg
          aria-hidden="true"
          class="orders-screen__refresh-icon"
          viewBox="0 0 24 24"
        >
          <path d="M21 12a9 9 0 0 0-15.34-6.34L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 15.34 6.34L21 16" />
          <path d="M21 21v-5h-5" />
        </svg>
      </template>
    </TopBar>

    <div class="orders-screen__header">
      <h1 id="orders-title" class="orders-screen__title">Заказы</h1>
      <FilterTabs
        v-model="activeFilter"
        class="orders-screen__filters"
        :items="filterTabs"
        layout="responsive"
      />
    </div>

    <div class="orders-screen__content">
      <EmptyState
        v-if="filteredOrders.length === 0"
        title="Заказов нет"
        description="Активные заказы появятся здесь"
      >
        <template #icon>
          <svg
            aria-hidden="true"
            class="orders-screen__empty-icon"
            viewBox="0 0 24 24"
          >
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </template>
      </EmptyState>
      <div v-else class="orders-screen__grid">
        <OrderCard
          v-for="order in filteredOrders"
          :key="order.id"
          :order="order"
          @action="handleCardAction(order, $event)"
        />
      </div>
    </div>

    <ConfirmDialog
      v-model:open="rejectDialogOpen"
      confirm-label="Отклонить"
      confirm-variant="destructive"
      description="Укажите причину отклонения заказа"
      input-placeholder="Причина отклонения"
      require-input
      title="Отклонить заказ"
      @cancel="clearSelection"
      @confirm="handleRejectConfirm"
    />
    <ConfirmDialog
      v-model:open="closeDialogOpen"
      confirm-label="Подтвердить"
      description="Подтвердите, что заказ был выдан клиенту"
      title="Выдать заказ"
      @cancel="clearSelection"
      @confirm="handleCloseConfirm"
    />

    <v-snackbar
      v-model="snackbarOpen"
      :color="snackbarTone"
      :timeout="ORDERS_SNACKBAR_TIMEOUT"
      role="status"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </section>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import type { Order, OrderAction } from "../../shared/ui/Admin.types";
import ConfirmDialog from "../../shared/ui/confirm-dialog/ConfirmDialog.vue";
import EmptyState from "../../shared/ui/empty-state/EmptyState.vue";
import FilterTabs from "../../shared/ui/filter-tabs/FilterTabs.vue";
import TopBar from "../../shell/TopBar.vue";
import {
  ORDER_FILTER_TABS,
  ORDERS_SNACKBAR_TIMEOUT,
} from "./OrdersScreen.constants";
import OrderCard from "./OrderCard.vue";
import type {
  OrderFilter,
  OrderMutationAction,
  OrdersScreenEmits,
  OrdersScreenProps,
  OrdersSnackbarTone,
} from "./OrdersScreen.types";

const props = defineProps<OrdersScreenProps>();
const emit = defineEmits<OrdersScreenEmits>();

const filterTabs = ORDER_FILTER_TABS;
const activeFilter = shallowRef<OrderFilter>("all");
const selectedOrderId = shallowRef<string | null>(null);
const rejectDialogOpen = shallowRef(false);
const closeDialogOpen = shallowRef(false);
const snackbarMessage = shallowRef("");
const snackbarOpen = shallowRef(false);
const snackbarTone = shallowRef<OrdersSnackbarTone>("success");

const filteredOrders = computed(() =>
  props.orders.filter((order) => {
    if (activeFilter.value === "all") {
      return order.status !== "Closed" && order.status !== "Rejected";
    }

    if (activeFilter.value === "created") {
      return order.status === "Created";
    }

    if (activeFilter.value === "confirmed") {
      return order.status === "Confirmed";
    }

    return order.status === "Ready for pickup";
  }),
);

function showSnackbar(message: string, tone: OrdersSnackbarTone = "success") {
  snackbarMessage.value = message;
  snackbarTone.value = tone;
  snackbarOpen.value = true;
}

function clearSelection() {
  selectedOrderId.value = null;
}

function handleRefresh() {
  emit("refresh");
  showSnackbar("Обновлено");
}

function emitAction(orderId: string, action: OrderMutationAction) {
  emit("order-action", { orderId, action });
  showSnackbar(
    action === "confirm" ? "Заказ подтверждён" : "Заказ готов к выдаче",
  );
}

function handleCardAction(order: Order, action: OrderAction) {
  if (action === "reject") {
    selectedOrderId.value = order.id;
    rejectDialogOpen.value = true;
    return;
  }

  if (action === "close") {
    selectedOrderId.value = order.id;
    closeDialogOpen.value = true;
    return;
  }

  emitAction(order.id, action);
}

function handleRejectConfirm(reason: string | undefined) {
  if (!selectedOrderId.value) {
    return;
  }

  emit("order-action", {
    orderId: selectedOrderId.value,
    action: "reject",
    reason,
  });
  showSnackbar(`Заказ отклонён${reason ? `: ${reason}` : ""}`, "error");
  clearSelection();
}

function handleCloseConfirm() {
  if (!selectedOrderId.value) {
    return;
  }

  emit("order-action", { orderId: selectedOrderId.value, action: "close" });
  showSnackbar("Заказ выдан");
  clearSelection();
}
</script>

<style scoped lang="scss">
.orders-screen {
  display: flex;
  min-width: 0;
  min-height: 100%;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  background: var(--expressa-color-surface-raised);
}

.orders-screen__header {
  display: contents;
}

.orders-screen__title {
  display: none;
  min-width: 0;
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: 2rem;
  overflow-wrap: anywhere;
}

.orders-screen__filters {
  flex: 0 0 auto;
  background: var(--expressa-color-surface);
}

.orders-screen__content {
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: var(--expressa-space-md) var(--expressa-space-md)
    var(--expressa-space-tab-bar-clearance);
}

.orders-screen__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--expressa-space-md);
}

.orders-screen__refresh-icon,
.orders-screen__empty-icon {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: var(--expressa-stroke-width-icon);
}

.orders-screen__refresh-icon {
  width: 22px;
  height: 22px;
}

.orders-screen__empty-icon {
  width: 48px;
  height: 48px;
}

@media (min-width: 768px) {
  .orders-screen {
    background: var(--expressa-color-surface);
  }

  .orders-screen__header {
    display: block;
    padding: var(--expressa-space-lg) var(--expressa-space-lg) 0;
  }

  .orders-screen__title {
    display: block;
    margin-bottom: var(--expressa-space-md);
  }

  .orders-screen__content {
    padding: var(--expressa-space-md) var(--expressa-space-lg)
      var(--expressa-space-lg);
  }

  .orders-screen__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
