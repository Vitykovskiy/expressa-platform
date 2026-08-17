<template>
  <section class="orders-screen" aria-label="Очередь заказов">
    <TopBar
      action-label="Обновить очередь"
      title="Заказы"
      @action="emit('refresh')"
    >
      <template #action>
        <RefreshCw :size="22" aria-hidden="true" />
      </template>
    </TopBar>

    <div class="orders-screen__toolbar">
      <h1 id="orders-title" class="orders-screen__title">Заказы</h1>
      <FilterTabs
        v-model="stageModel"
        class="orders-screen__filters"
        :items="queueFilters"
        layout="responsive"
      />
      <div class="orders-screen__search">
        <label class="orders-screen__field-label" for="orders-search">
          Номер заказа
        </label>
        <AdminTextField
          id="orders-search"
          :model-value="props.search"
          placeholder="Поиск по номеру"
          type="search"
          @update:model-value="emit('update:search', $event)"
        />
      </div>
    </div>

    <div class="orders-screen__content">
      <div
        v-if="props.status === 'loading'"
        class="orders-screen__grid"
        aria-busy="true"
        aria-label="Загрузка очереди"
      >
        <div v-for="index in 4" :key="index" class="orders-screen__skeleton" />
      </div>
      <div
        v-else-if="props.status === 'error' && props.error !== null"
        class="orders-screen__state orders-screen__state--error"
        role="alert"
      >
        <strong>{{ props.error.code }}</strong
        >: {{ props.error.message }}
        <span v-if="props.error.requestId">
          Номер запроса: {{ props.error.requestId }}
        </span>
        <AdminButton
          class="orders-screen__retry"
          variant="secondary"
          @click="emit('refresh')"
        >
          Повторить
        </AdminButton>
      </div>
      <EmptyState
        v-else-if="props.orders.length === 0"
        description="Активные заказы появятся здесь"
        title="Заказов нет"
      >
        <template #icon>
          <ClipboardCheck :size="28" />
        </template>
      </EmptyState>
      <div v-else class="orders-screen__grid">
        <OrderCard
          v-for="order in props.orders"
          :key="order.id"
          :details="props.selectedOrderId === order.id ? props.details : null"
          :details-loading="
            props.selectedOrderId === order.id && props.detailsLoading
          "
          :order="order"
          :transition-loading="
            props.selectedOrderId === order.id && props.transitionLoading
          "
          @open="emit('open', $event)"
          @transition="emit('transition')"
        />
      </div>
    </div>
    <p
      v-if="props.actionError !== null"
      class="orders-screen__action-error"
      role="alert"
    >
      {{ props.actionError.code }}: {{ props.actionError.message }}
      <span v-if="props.actionError.requestId">
        Номер запроса: {{ props.actionError.requestId }}
      </span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ClipboardCheck, RefreshCw } from "lucide-vue-next";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import EmptyState from "../../../shared/ui/admin/empty-state/EmptyState.vue";
import FilterTabs from "../../../shared/ui/admin/filter-tabs/FilterTabs.vue";
import TopBar from "../../../widgets/admin-shell/TopBar.vue";
import OrderCard from "./OrderCard.vue";
import { queueFilters } from "./OrdersScreen.constants";
import type {
  OrdersScreenEmits,
  OrdersScreenProps,
  QueueFilter,
} from "./OrdersScreen.types";

const props = defineProps<OrdersScreenProps>();
const emit = defineEmits<OrdersScreenEmits>();
const stageModel = computed<QueueFilter>({
  get: () => props.stage,
  set: (stage) => emit("update:stage", stage),
});
</script>

<style scoped lang="scss">
.orders-screen {
  display: flex;
  min-height: 100%;
  min-width: 0;
  flex-direction: column;
  background: var(--expressa-color-surface-raised);
}
.orders-screen__toolbar {
  display: grid;
  gap: var(--expressa-space-sm);
  background: var(--expressa-color-surface);
}
.orders-screen__title {
  display: none;
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-heading);
}
.orders-screen__filters {
  order: 1;
}
.orders-screen__search {
  display: grid;
  gap: var(--expressa-space-field-label);
  padding: 0 var(--expressa-space-md) var(--expressa-space-md);
}
.orders-screen__field-label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.orders-screen__content {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--expressa-space-md) var(--expressa-space-md)
    var(--expressa-space-tab-bar-clearance);
}
.orders-screen__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--expressa-space-md);
}
.orders-screen__skeleton {
  min-height: 192px;
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface);
  box-shadow: var(--expressa-shadow-card);
}
.orders-screen__state,
.orders-screen__action-error {
  display: grid;
  gap: var(--expressa-space-sm);
  margin: 0;
  padding: var(--expressa-space-md);
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface);
  box-shadow: var(--expressa-shadow-card);
}
.orders-screen__state--error,
.orders-screen__action-error {
  color: var(--expressa-color-status-error);
}
.orders-screen__retry {
  justify-self: start;
}
.orders-screen__action-error {
  margin: 0 var(--expressa-space-md) var(--expressa-space-tab-bar-clearance);
}
@media (min-width: 768px) {
  .orders-screen {
    background: var(--expressa-color-surface);
  }
  .orders-screen__toolbar {
    gap: var(--expressa-space-md);
    padding: var(--expressa-space-lg) var(--expressa-space-lg) 0;
  }
  .orders-screen__title {
    display: block;
  }
  .orders-screen__filters {
    order: initial;
  }
  .orders-screen__search {
    padding: 0;
  }
  .orders-screen__content {
    padding: var(--expressa-space-md) var(--expressa-space-lg)
      var(--expressa-space-lg);
  }
  .orders-screen__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .orders-screen__action-error {
    margin: 0 var(--expressa-space-lg) var(--expressa-space-lg);
  }
}
@media (min-width: 1024px) {
  .orders-screen__toolbar {
    grid-template-columns: minmax(0, 1fr) minmax(200px, 280px);
  }
  .orders-screen__filters {
    grid-column: 1;
    grid-row: 2;
  }
  .orders-screen__search {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: end;
  }
}
</style>
