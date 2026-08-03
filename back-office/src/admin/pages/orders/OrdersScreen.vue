<template>
  <section class="orders-screen" aria-labelledby="orders-title">
    <div class="orders-screen__workspace">
      <header class="orders-screen__header">
        <h1 id="orders-title" class="orders-screen__title">Заказы</h1>
        <AdminButton
          aria-label="Обновить заказы"
          title="Обновить заказы"
          variant="secondary"
          @click="handleRefresh"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="20"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M21 12a9 9 0 0 0-15.34-6.34L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 15.34 6.34L21 16" />
            <path d="M21 21v-5h-5" />
          </svg>
        </AdminButton>
      </header>

      <FilterTabs
        v-model="activeFilter"
        class="orders-screen__filters"
        :items="filterTabs"
      />

      <div class="orders-screen__content">
        <EmptyState
          v-if="filteredOrders.length === 0"
          title="Заказов нет"
          description="Активные заказы появятся здесь"
        />
        <div v-else class="orders-screen__grid">
          <OrderCard
            v-for="order in filteredOrders"
            :key="order.id"
            :order="order"
            @action="handleCardAction(order, $event)"
          />
        </div>
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
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import ConfirmDialog from "../../shared/ui/confirm-dialog/ConfirmDialog.vue";
import EmptyState from "../../shared/ui/empty-state/EmptyState.vue";
import FilterTabs from "../../shared/ui/filter-tabs/FilterTabs.vue";
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

function showSnackbar(message: string) {
  snackbarMessage.value = message;
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
  showSnackbar(`Заказ отклонён${reason ? `: ${reason}` : ""}`);
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
  min-width: 0;
  min-height: 100%;
  background: var(--expressa-color-surface);
}

.orders-screen__workspace {
  display: grid;
  width: min(100%, 1120px);
  min-width: 0;
  min-height: 100%;
  grid-template-rows: auto auto minmax(0, 1fr);
  margin: 0 auto;
}

.orders-screen__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-md);
}

.orders-screen__title {
  min-width: 0;
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-tight);
  overflow-wrap: anywhere;
}

.orders-screen__filters {
  padding-right: var(--expressa-space-md);
  padding-left: var(--expressa-space-md);
}

.orders-screen__content {
  min-width: 0;
  padding: var(--expressa-space-md);
}

.orders-screen__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--expressa-space-md);
}

@media (min-width: 768px) {
  .orders-screen__header {
    padding: var(--expressa-space-lg);
  }

  .orders-screen__filters {
    padding-right: var(--expressa-space-lg);
    padding-left: var(--expressa-space-lg);
  }

  .orders-screen__content {
    padding: var(--expressa-space-lg);
  }
}

@media (min-width: 1024px) {
  .orders-screen__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
