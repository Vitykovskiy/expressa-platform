<template>
  <article class="order-card" :class="{ 'order-card--muted': isMuted }">
    <ui-btn
      type="button"
      class="order-card__summary"
      variant="text"
      :aria-controls="detailsId"
      :aria-expanded="props.expanded"
      @click="emit('toggle')"
    >
      <span class="order-card__summary-content">
        <span class="order-card__title">Заказ #{{ props.order.id }}</span>
        <ui-badge class="order-card__status" :tone="statusTone">
          {{ props.statusLabel }}
        </ui-badge>
        <small class="order-card__meta">
          {{ props.order.createdAt }} · {{ props.order.items.length }} поз.
        </small>
      </span>
      <strong class="order-card__total">
        {{ props.order.totalRub }} ₽
        <ChevronUp
          v-if="props.expanded"
          class="order-card__chevron"
          aria-hidden="true"
        />
        <ChevronDown v-else class="order-card__chevron" aria-hidden="true" />
      </strong>
    </ui-btn>
    <div v-show="props.expanded" :id="detailsId" class="order-card__details">
      <p class="order-card__slot">
        Слот: {{ props.order.slotDate }} {{ props.order.slotTimeFrom }}-{{
          props.order.slotTimeTo
        }}
      </p>
      <ul class="order-card__items">
        <li
          v-for="(item, index) in props.order.items"
          :key="`${props.order.id}-${index}`"
          class="order-card__item"
        >
          <span class="order-card__item-copy">
            {{ item.productName
            }}<template v-if="item.size"> ({{ item.size }})</template> x{{
              item.quantity
            }}
            <small
              v-for="addon in item.addons"
              :key="addon.name"
              class="order-card__addon"
            >
              + {{ addon.name }} x{{ addon.quantity }}
            </small>
          </span>
          <strong class="order-card__line-total"
            >{{ item.lineTotalRub }} ₽</strong
          >
        </li>
      </ul>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import UiBadge from "@/shared/ui/customer/badge/UiBadge.vue";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import { ORDER_STATUS_TONES } from "./OrderCard.constants";
import type { OrderCardEmits, OrderCardProps } from "./OrderCard.types";

const props = defineProps<OrderCardProps>();
const emit = defineEmits<OrderCardEmits>();

const detailsId = computed(() => `order-details-${props.order.id}`);
const isMuted = computed(
  () =>
    props.order.status === "completed" || props.order.status === "cancelled",
);
const statusTone = computed(() => ORDER_STATUS_TONES[props.order.status]);
</script>

<style scoped lang="scss">
.order-card {
  overflow: hidden;
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card);
}

.order-card--muted {
  color: var(--customer-text);
  background: var(--customer-surface-muted);
  box-shadow: none;
}

.order-card__summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  padding: var(--customer-space-9) var(--customer-space-10);
  color: inherit;
  text-align: left;
  background: transparent;
}

.order-card__summary-content,
.order-card__meta,
.order-card__addon {
  display: block;
}

.order-card__summary-content {
  min-width: 0;
}

.order-card__title {
  display: inline-block;
  margin-right: var(--customer-space-5);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
}

.order-card__status {
  vertical-align: middle;
}

.order-card__meta {
  margin-top: var(--customer-space-5);
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
}

.order-card--muted .order-card__meta,
.order-card--muted .order-card__slot {
  color: var(--customer-text-secondary-on-brand);
}

.order-card__total {
  flex: 0 0 auto;
  color: var(--customer-background);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
}

.order-card--muted .order-card__total,
.order-card--muted .order-card__line-total {
  color: var(--customer-text);
}

.order-card__chevron {
  display: inline;
  width: var(--customer-space-9);
  height: var(--customer-space-9);
  margin-left: var(--customer-space-3);
  vertical-align: text-bottom;
}

.order-card__details {
  padding: var(--customer-space-8) var(--customer-space-10);
  background: var(--customer-surface-info);
  border-top: 1px solid var(--customer-border-subtle-on-surface);
}

.order-card--muted .order-card__details {
  background: var(--customer-surface-muted-on-brand);
  border-color: var(--customer-surface-muted);
}

.order-card__slot {
  margin: 0 0 var(--customer-space-6);
  color: var(--customer-text-secondary-on-surface);
  font-size: var(--customer-font-size-2xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-label);
}

.order-card__items {
  display: flex;
  flex-direction: column;
  gap: var(--customer-space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.order-card__item {
  display: flex;
  justify-content: space-between;
  gap: var(--customer-space-7);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
}

.order-card__item-copy {
  min-width: 0;
}

.order-card__addon {
  margin-top: var(--customer-space-1);
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-2xs);
  font-weight: var(--customer-font-weight-semibold);
}

.order-card--muted .order-card__addon {
  color: var(--customer-text-muted-on-brand);
}

.order-card__line-total {
  flex: 0 0 auto;
  color: var(--customer-background);
}
</style>
