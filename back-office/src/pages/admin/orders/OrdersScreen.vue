<template>
  <section class="orders-screen" aria-labelledby="orders-title">
    <header class="orders-screen__header">
      <div>
        <h1 id="orders-title">Очередь заказов</h1>
        <p>Актуальные заказы сотрудников</p>
      </div>
      <button type="button" @click="emit('refresh')">Обновить</button>
    </header>

    <div class="orders-screen__controls">
      <label>
        Номер заказа
        <input :value="props.search" type="search" @input="updateSearch" />
      </label>
      <label>
        Стадия
        <select :value="props.stage" @change="updateStage">
          <option
            v-for="filter in queueFilters"
            :key="filter.value"
            :value="filter.value"
          >
            {{ filter.label }}
          </option>
        </select>
      </label>
    </div>

    <div
      v-if="props.status === 'loading'"
      class="orders-screen__state"
      aria-live="polite"
    >
      Загрузка очереди…
    </div>
    <div
      v-else-if="props.status === 'error' && props.error !== null"
      class="orders-screen__state"
      role="alert"
    >
      <strong>{{ props.error.code }}</strong
      >: {{ props.error.message
      }}<span v-if="props.error.requestId"
        >. Номер запроса: {{ props.error.requestId }}</span
      >
    </div>
    <div v-else-if="props.orders.length === 0" class="orders-screen__state">
      Заказов не найдено.
    </div>
    <div v-else class="orders-screen__grid">
      <OrderCard
        v-for="order in props.orders"
        :key="order.id"
        :order="order"
        :details="props.selectedOrderId === order.id ? props.details : null"
        :details-loading="
          props.selectedOrderId === order.id && props.detailsLoading
        "
        :transition-loading="
          props.selectedOrderId === order.id && props.transitionLoading
        "
        @open="emit('open', $event)"
        @transition="emit('transition')"
      />
    </div>
    <p
      v-if="props.actionError !== null"
      class="orders-screen__action-error"
      role="alert"
    >
      {{ props.actionError.code }}: {{ props.actionError.message
      }}<span v-if="props.actionError.requestId"
        >. Номер запроса: {{ props.actionError.requestId }}</span
      >
    </p>
  </section>
</template>

<script setup lang="ts">
import OrderCard from "./OrderCard.vue";
import { queueFilters } from "./OrdersScreen.constants";
import type {
  OrdersScreenEmits,
  OrdersScreenProps,
  QueueFilter,
} from "./OrdersScreen.types";

const props = defineProps<OrdersScreenProps>();
const emit = defineEmits<OrdersScreenEmits>();

function updateSearch(event: Event): void {
  emit("update:search", (event.target as HTMLInputElement).value);
}

function updateStage(event: Event): void {
  emit(
    "update:stage",
    (event.target as HTMLSelectElement).value as QueueFilter,
  );
}
</script>

<style scoped lang="scss">
.orders-screen {
  display: grid;
  gap: var(--expressa-space-lg);
  padding: var(--expressa-space-lg);
}
.orders-screen__header,
.orders-screen__controls {
  display: flex;
  gap: var(--expressa-space-md);
  align-items: end;
  justify-content: space-between;
}
.orders-screen__header h1,
.orders-screen__header p {
  margin: 0;
}
.orders-screen__header p {
  color: var(--expressa-color-text-muted);
}
.orders-screen__controls {
  justify-content: start;
}
.orders-screen__controls label {
  display: grid;
  gap: var(--expressa-space-xs);
}
.orders-screen__controls input,
.orders-screen__controls select,
.orders-screen__header button {
  min-height: var(--expressa-touch-target-min);
  padding: var(--expressa-space-sm);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
}
.orders-screen__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--expressa-space-md);
}
.orders-screen__state,
.orders-screen__action-error {
  padding: var(--expressa-space-md);
  margin: 0;
  background: var(--expressa-color-surface-raised);
  border-radius: var(--expressa-radius-md);
}
.orders-screen__action-error {
  color: var(--expressa-color-error);
}
@media (max-width: 767px) {
  .orders-screen__header,
  .orders-screen__controls {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
