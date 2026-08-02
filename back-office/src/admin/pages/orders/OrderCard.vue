<template>
  <article class="order-card">
    <div class="order-card__heading">
      <span class="order-card__number">{{ props.order.orderNumber }}</span>
      <StatusBadge :status="props.order.status" />
    </div>

    <p class="order-card__slot">
      <svg aria-hidden="true" class="order-card__clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
      {{ props.order.slotTime }}
    </p>

    <div class="order-card__details">
      <h2 class="order-card__customer">
        {{ props.order.customerName }}
      </h2>
      <p class="order-card__items">
        {{ props.order.items }}
      </p>
    </div>

    <p class="order-card__total">{{ props.order.total }} ₽</p>

    <div
      v-if="orderActions.length"
      class="order-card__actions"
      :class="{ 'order-card__actions--single': orderActions.length === 1 }"
    >
      <AdminButton
        v-for="action in orderActions"
        :key="action.action"
        :variant="action.variant"
        @click="emit('action', action.action)"
      >
        {{ action.label }}
      </AdminButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import StatusBadge from "../../shared/ui/status-badge/StatusBadge.vue";
import { ORDER_CARD_ACTIONS } from "./OrderCard.constants";
import type { OrderCardEmits, OrderCardProps } from "./OrderCard.types";

const props = defineProps<OrderCardProps>();
const emit = defineEmits<OrderCardEmits>();
const orderActions = computed(() => ORDER_CARD_ACTIONS[props.order.status]);
</script>

<style scoped lang="scss">
.order-card {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-md);
  overflow: hidden;
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
  box-shadow: var(--expressa-shadow-card);
}

.order-card__heading {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
}

.order-card__number {
  min-width: 0;
  color: var(--expressa-color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  overflow-wrap: anywhere;
}

.order-card__slot {
  display: flex;
  align-items: center;
  gap: var(--expressa-space-xs);
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}

.order-card__clock {
  width: var(--expressa-size-icon-clock);
  height: var(--expressa-size-icon-clock);
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: var(--expressa-stroke-width-icon);
}

.order-card__details {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-xs);
}

.order-card__customer,
.order-card__items,
.order-card__total {
  margin: 0;
  overflow-wrap: anywhere;
}

.order-card__customer,
.order-card__total {
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-emphasis);
}

.order-card__items {
  display: -webkit-box;
  overflow: hidden;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-caption);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.order-card__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--expressa-space-sm);
}

.order-card__actions--single {
  grid-template-columns: minmax(0, 1fr);
}
</style>
