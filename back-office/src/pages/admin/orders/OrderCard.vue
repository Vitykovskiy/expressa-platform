<template>
  <article
    class="order-card"
    data-testid="staff-order-card"
    :data-order-id="props.order.id"
  >
    <div class="order-card__heading">
      <span class="order-card__number">{{ props.order.number }}</span>
      <span class="order-card__stage" :data-tone="stage.tone">{{
        stage.label
      }}</span>
    </div>

    <div class="order-card__time">
      <Clock :size="14" aria-hidden="true" />
      <span class="order-card__time-value">{{
        formatDate(props.order.createdAt)
      }}</span>
    </div>

    <p class="order-card__summary">
      {{
        props.details === null
          ? "Откройте детали, чтобы увидеть состав заказа"
          : itemsSummary
      }}
    </p>
    <p class="order-card__total">{{ formatMoney(props.order.total) }}</p>

    <AdminButton
      class="order-card__details-button"
      variant="secondary"
      @click="emit('open', props.order.id)"
    >
      {{ props.details === null ? "Открыть детали" : "Скрыть детали" }}
    </AdminButton>

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
      <p class="order-card__customer">
        Клиент:
        <span class="order-card__customer-phone">{{
          props.details.customer.phoneE164
        }}</span>
      </p>
      <ul class="order-card__items" aria-label="Состав заказа">
        <li
          v-for="item in props.details.snapshot"
          :key="item.productId"
          class="order-card__item"
        >
          {{ item.productName }}{{ item.size ? `, ${item.size}` : "" }} ×
          {{ item.quantity }} — {{ formatMoney(item.lineTotal) }}
          <span v-if="item.modifiers.length"
            >({{
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
          :key="`${event.occurredAt}-${event.actorLabel}`"
        >
          {{ stageLabel(event.from) }} — {{ stageLabel(event.to) }},
          {{ formatDate(event.occurredAt) }}, Автор: {{ event.actorLabel }}
        </li>
      </ol>
      <AdminButton
        v-if="action !== undefined"
        class="order-card__action"
        :disabled="props.transitionLoading"
        @click="emit('transition')"
      >
        {{ props.transitionLoading ? "Обновление…" : action.label }}
      </AdminButton>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Clock } from "lucide-vue-next";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import { orderActions, orderStages } from "./OrderCard.constants";
import type { OrderCardEmits, OrderCardProps } from "./OrderCard.types";

const props = defineProps<OrderCardProps>();
const emit = defineEmits<OrderCardEmits>();
const stage = computed(() => orderStages[props.order.stage]);
const action = computed(
  () => orderActions[props.details?.stage ?? props.order.stage],
);
const itemsSummary = computed(
  () =>
    props.details?.snapshot
      .map((item) => `${item.productName} × ${item.quantity}`)
      .join(", ") ?? "",
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
  }).format(value);
}
</script>

<style scoped lang="scss">
.order-card {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-row-block) var(--expressa-space-md);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface);
  box-shadow: var(--expressa-shadow-card);
}
.order-card__heading,
.order-card__time {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
}
.order-card__number,
.order-card__time {
  color: var(--expressa-color-text-muted);
}
.order-card__number {
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  overflow-wrap: anywhere;
}
.order-card__stage {
  flex: 0 0 auto;
  padding: var(--expressa-space-badge-block) var(--expressa-space-control-block);
  border-radius: var(--expressa-radius-pill);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption-compact);
  white-space: nowrap;
}
.order-card__stage[data-tone="success"] {
  color: var(--expressa-color-status-success);
  background: var(--expressa-color-status-success-surface);
}
.order-card__stage[data-tone="warning"] {
  color: var(--expressa-color-status-warning);
  background: var(--expressa-color-status-warning-surface);
}
.order-card__stage[data-tone="info"] {
  color: var(--expressa-color-accent);
  background: var(--expressa-color-status-info-surface);
}
.order-card__time {
  justify-content: flex-start;
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption);
}
.order-card__summary,
.order-card__total,
.order-card__customer {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
.order-card__summary {
  display: -webkit-box;
  min-height: calc(
    var(--expressa-font-size-body) * var(--expressa-line-height-body) * 2
  );
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.order-card__total {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-emphasis);
}
.order-card__details-button,
.order-card__action {
  width: 100%;
}
.order-card__loading {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-body);
}
.order-card__details {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-sm);
  padding-top: var(--expressa-space-sm);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.order-card__customer {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body);
}
.order-card__items,
.order-card__events {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-xs);
  margin: 0;
  padding-left: var(--expressa-space-lg);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-body);
}
.order-card__item {
  overflow-wrap: anywhere;
}
</style>
