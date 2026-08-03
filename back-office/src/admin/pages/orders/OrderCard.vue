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
      <p v-if="typeof props.order.items === 'string'" class="order-card__items">
        {{ props.order.items }}
      </p>
      <ul v-else class="order-card__items">
        <li
          v-for="(item, itemIndex) in props.order.items"
          :key="itemIndex"
          class="order-card__item"
        >
          <div class="order-card__product-row">
            <strong class="order-card__product-name">{{
              item.productName
            }}</strong>
            <span class="order-card__quantity">× {{ item.quantity }}</span>
          </div>
          <p v-if="item.size" class="order-card__size">
            Размер {{ item.size }}
          </p>
          <div v-if="item.addons.length" class="order-card__addons">
            <span class="order-card__addons-title">Добавки</span>
            <ul class="order-card__addons-list">
              <li
                v-for="(addon, addonIndex) in item.addons"
                :key="addonIndex"
                class="order-card__addon"
              >
                <span class="order-card__addon-name">+ {{ addon.name }}</span>
                <span class="order-card__quantity">
                  × {{ addon.quantity }}
                </span>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>

    <p class="order-card__total">{{ props.order.total }} ₽</p>

    <div v-if="orderActions.length" class="order-card__actions">
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

.order-card__customer {
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-emphasis);
}

.order-card__items {
  display: grid;
  gap: var(--expressa-space-xs);
  padding: 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-caption);
  list-style: none;
}

.order-card__item,
.order-card__addons,
.order-card__addons-list {
  display: grid;
  gap: var(--expressa-space-xs);
}

.order-card__item:not(:first-child) {
  padding-top: var(--expressa-space-sm);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.order-card__product-row,
.order-card__addon {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--expressa-space-xs);
}

.order-card__product-name,
.order-card__addon-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.order-card__product-name {
  font-weight: var(--expressa-font-weight-semibold);
}

.order-card__quantity {
  white-space: nowrap;
}

.order-card__size,
.order-card__addons-title {
  margin: 0;
  color: var(--expressa-color-text-muted);
}

.order-card__addons {
  padding: var(--expressa-space-sm);
  background: var(--expressa-color-surface-raised);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
}

.order-card__addons-list {
  padding: 0;
  list-style: none;
}

.order-card__total {
  padding-top: var(--expressa-space-sm);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-emphasis);
}

.order-card__actions {
  display: grid;
  gap: var(--expressa-space-sm);
  padding-top: var(--expressa-space-sm);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
</style>
