<template>
  <article
    class="order-card"
    :class="`order-card--${props.order.stage.toLowerCase()}`"
  >
    <button
      type="button"
      class="order-card__header"
      :aria-controls="detailsId"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="order-card__topline">
        <span class="order-card__title-row">
          <span class="order-card__title">Заказ №{{ props.order.number }}</span>
          <span class="order-card__stage">{{ props.stageLabel }}</span>
        </span>
        <span class="order-card__summary">
          <strong>{{ formatRubles(props.order.total) }}</strong>
          <ChevronUp v-if="isOpen" aria-hidden="true" />
          <ChevronDown v-else aria-hidden="true" />
        </span>
      </span>
      <span class="order-card__meta">
        {{ formattedCreatedAt }} · {{ props.order.items.length }}
        {{ itemLabel }}
      </span>
    </button>
    <div v-if="isOpen" :id="detailsId" class="order-card__details">
      <ul class="order-card__items" aria-label="Состав заказа">
        <li v-for="item in props.order.items" :key="itemKey(item)">
          <span class="order-card__item-main">
            <span
              >{{ item.productName
              }}<template v-if="item.size"> ({{ item.size }})</template></span
            >
            <span class="order-card__item-quantity">×{{ item.quantity }}</span>
          </span>
          <strong>{{ formatRubles(item.lineTotal) }}</strong>
          <span
            v-for="modifier in item.modifiers"
            :key="modifier.modifierOptionId"
            class="order-card__modifier"
          >
            + {{ modifier.modifierName }}
          </span>
        </li>
      </ul>
    </div>
    <ui-btn class="order-card__open" :to="`/orders/${props.order.id}`"
      >Открыть заказ</ui-btn
    >
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import { formatRubles } from "@/entities/customer/model/money";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import type { OrderCardProps } from "./OrderCard.types";
import type { OrderItem } from "@/shared/api/orders.api";

const props = defineProps<OrderCardProps>();
const isOpen = ref(false);
const detailsId = `order-card-details-${props.order.id}`;
const formattedCreatedAt = computed(() =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(props.order.createdAt)),
);
const itemLabel = computed(() => {
  const count = props.order.items.length;
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "позиций";
  if (lastDigit === 1) return "позиция";
  if (lastDigit >= 2 && lastDigit <= 4) return "позиции";

  return "позиций";
});

function itemKey(item: OrderItem): string {
  return [
    item.productId,
    item.variantId ?? "other",
    ...item.modifiers.map((modifier) => modifier.modifierOptionId),
  ].join(":");
}
</script>

<style scoped lang="scss">
.order-card {
  overflow: hidden;
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
  box-shadow: var(--customer-shadow-card);
}
.order-card--issued {
  color: var(--customer-text);
  background: var(--customer-surface-muted);
  box-shadow: none;
}
.order-card__header {
  display: grid;
  gap: var(--customer-space-5);
  width: 100%;
  padding: var(--customer-space-9) var(--customer-space-10);
  color: inherit;
  background: transparent;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.order-card__header:focus-visible,
.order-card__open:focus-visible {
  outline: 2px solid var(--customer-focus-ring);
  outline-offset: -2px;
}
.order-card__topline,
.order-card__title-row,
.order-card__summary,
.order-card__item-main {
  display: flex;
  align-items: center;
}
.order-card__topline {
  justify-content: space-between;
  gap: var(--customer-space-7);
}
.order-card__title-row {
  flex-wrap: wrap;
  gap: var(--customer-space-5);
  min-width: 0;
}
.order-card__title {
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
  overflow-wrap: anywhere;
}
.order-card__stage {
  padding: var(--customer-space-2) var(--customer-space-6);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-2xs);
  font-weight: var(--customer-font-weight-extrabold);
  line-height: var(--customer-line-height-label);
  white-space: nowrap;
}
.order-card--created .order-card__stage {
  color: var(--customer-color-warning);
  background: var(--customer-color-warning-surface);
}
.order-card--accepted .order-card__stage,
.order-card--preparing .order-card__stage {
  color: var(--customer-color-blue-500);
  background: var(--customer-color-info-surface);
}
.order-card--ready .order-card__stage {
  color: var(--customer-color-success);
  background: var(--customer-color-success-surface);
}
.order-card--issued .order-card__stage {
  color: var(--customer-text-secondary-on-brand);
  background: var(--customer-color-white-12);
}
.order-card__summary {
  flex: 0 0 auto;
  gap: var(--customer-space-5);
}
.order-card__summary strong {
  color: var(--customer-color-blue-500);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
  white-space: nowrap;
}
.order-card--issued .order-card__summary strong {
  color: var(--customer-text);
}
.order-card__summary svg {
  flex: 0 0 auto;
  width: var(--customer-font-size-md);
  height: var(--customer-font-size-md);
  color: var(--customer-color-blue-700-45);
}
.order-card--issued .order-card__summary svg {
  color: var(--customer-text-secondary-on-brand);
}
.order-card__meta,
.order-card__item-quantity,
.order-card__modifier {
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
}
.order-card--issued .order-card__meta,
.order-card--issued .order-card__item-quantity,
.order-card--issued .order-card__modifier {
  color: var(--customer-text-secondary-on-brand);
}
.order-card__details {
  display: grid;
  gap: var(--customer-space-7);
  padding: var(--customer-space-8) var(--customer-space-10)
    var(--customer-space-10);
  background: var(--customer-surface-info);
  border-top: 1px solid var(--customer-border-subtle-on-surface);
}
.order-card--issued .order-card__details {
  background: var(--customer-surface-muted-on-brand);
  border-color: var(--customer-border-subtle-on-brand);
}
.order-card__items {
  display: grid;
  gap: var(--customer-space-5);
  padding: 0;
  margin: 0;
  list-style: none;
}
.order-card__items li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--customer-space-3) var(--customer-space-7);
  padding-bottom: var(--customer-space-5);
  border-bottom: 1px solid var(--customer-border-subtle-on-surface);
}
.order-card__items li:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.order-card--issued .order-card__items li {
  border-color: var(--customer-border-subtle-on-brand);
}
.order-card__item-main {
  min-width: 0;
  gap: var(--customer-space-5);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
  overflow-wrap: anywhere;
}
.order-card__item-main > span:first-child {
  min-width: 0;
}
.order-card__item-main + strong {
  color: var(--customer-color-blue-500);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-extrabold);
  white-space: nowrap;
}
.order-card--issued .order-card__item-main + strong {
  color: var(--customer-text);
}
.order-card__modifier {
  grid-column: 1 / -1;
}
.order-card__open {
  align-self: start;
  margin: 0 var(--customer-space-10) var(--customer-space-10);
  min-height: 0;
  padding: var(--customer-space-5) var(--customer-space-8);
  color: var(--customer-color-blue-500);
  background: var(--customer-color-blue-500-10);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-extrabold);
}
.order-card--issued .order-card__open {
  color: var(--customer-text);
  background: var(--customer-color-white-12);
}
</style>
