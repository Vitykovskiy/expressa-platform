<template>
  <article class="order-card">
    <div class="order-card__heading">
      <div>
        <p class="order-card__number">№ {{ props.order.number }}</p>
        <p class="order-card__date">{{ formatDate(props.order.createdAt) }}</p>
      </div>
      <span class="order-card__stage" :data-tone="stage.tone">{{
        stage.label
      }}</span>
    </div>

    <p class="order-card__total">{{ formatMoney(props.order.totalMinor) }}</p>

    <button
      class="order-card__details-button"
      type="button"
      @click="emit('open', props.order.id)"
    >
      {{ props.details === null ? "Открыть детали" : "Скрыть детали" }}
    </button>

    <div
      v-if="props.detailsLoading"
      class="order-card__loading"
      aria-live="polite"
    >
      Загрузка деталей…
    </div>
    <section
      v-else-if="props.details !== null"
      class="order-card__details"
      :aria-label="`Детали заказа ${props.order.number}`"
    >
      <p>Клиент: {{ props.details.customer.phoneE164 }}</p>
      <ul class="order-card__items">
        <li
          v-for="item in props.details.snapshot"
          :key="item.productId"
          class="order-card__item"
        >
          {{ item.productName }}{{ item.size ? `, ${item.size}` : "" }} ×
          {{ item.quantity }} — {{ formatMoney(item.lineTotalMinor) }}
          <span v-if="item.modifiers.length">
            ({{
              item.modifiers
                .map((modifier) => modifier.modifierName)
                .join(", ")
            }})</span
          >
        </li>
      </ul>
      <ol class="order-card__events">
        <li
          v-for="event in props.details.events"
          :key="`${event.occurredAt}-${event.actorId}`"
        >
          {{ stageLabel(event.from) }} — {{ stageLabel(event.to) }},
          {{ formatDate(event.occurredAt) }}
        </li>
      </ol>
      <button
        v-if="action !== undefined"
        class="order-card__action"
        type="button"
        :disabled="props.transitionLoading"
        @click="emit('transition')"
      >
        {{ props.transitionLoading ? "Обновление…" : action.label }}
      </button>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { orderActions, orderStages } from "./OrderCard.constants";
import type { OrderCardEmits, OrderCardProps } from "./OrderCard.types";

const props = defineProps<OrderCardProps>();
const emit = defineEmits<OrderCardEmits>();
const stage = computed(() => orderStages[props.order.stage]);
const action = computed(
  () => orderActions[props.details?.stage ?? props.order.stage],
);

function stageLabel(value: keyof typeof orderStages): string {
  return orderStages[value].label;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(value / 100);
}
</script>

<style scoped lang="scss">
.order-card {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-md);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}
.order-card__heading {
  display: flex;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
}
.order-card__number,
.order-card__date,
.order-card__total,
.order-card__details p {
  margin: 0;
}
.order-card__number {
  font-weight: var(--expressa-font-weight-bold);
}
.order-card__date {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}
.order-card__stage {
  padding: var(--expressa-space-xs) var(--expressa-space-sm);
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-surface-raised);
}
.order-card__stage[data-tone="success"] {
  color: var(--expressa-color-success);
}
.order-card__stage[data-tone="warning"] {
  color: var(--expressa-color-warning);
}
.order-card__total {
  font-weight: var(--expressa-font-weight-semibold);
}
.order-card__details-button,
.order-card__action {
  min-height: var(--expressa-touch-target-min);
  padding: var(--expressa-space-sm);
  color: inherit;
  background: transparent;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  cursor: pointer;
}
.order-card__action {
  color: var(--expressa-color-on-primary);
  background: var(--expressa-color-primary);
  border-color: var(--expressa-color-primary);
}
.order-card__details {
  display: grid;
  gap: var(--expressa-space-sm);
  padding-top: var(--expressa-space-sm);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.order-card__items,
.order-card__events {
  display: grid;
  gap: var(--expressa-space-xs);
  padding-left: var(--expressa-space-lg);
  margin: 0;
}
.order-card__loading {
  color: var(--expressa-color-text-muted);
}
</style>
