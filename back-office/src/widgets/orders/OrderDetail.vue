<template>
  <section class="order-detail" aria-labelledby="order-detail-heading">
    <h2 id="order-detail-heading" class="order-detail__heading" tabindex="-1">
      {{ title }}
    </h2>
    <div v-if="error" class="order-detail__feedback" aria-live="polite">
      <p class="order-detail__error">{{ error }}</p>
      <p v-if="updatedAt">Подтверждено {{ formatOrderDate(updatedAt) }}</p>
      <UiButton
        variant="secondary"
        :disabled="loading"
        @activate="emit('retry')"
        >Повторить</UiButton
      >
    </div>
    <p v-if="initialLoading" role="status">Загружаем заказ</p>
    <slot v-if="order === null" name="action" />
    <template v-if="order">
      <dl class="order-detail__identity">
        <div class="order-detail__fact">
          <dt>Стадия</dt>
          <dd>{{ stageLabels[order.stage] }}</dd>
        </div>
        <div class="order-detail__fact">
          <dt>Создан</dt>
          <dd>
            <time :datetime="order.createdAt">{{
              formatOrderDate(order.createdAt)
            }}</time>
          </dd>
        </div>
        <div class="order-detail__fact">
          <dt>Покупатель</dt>
          <dd>{{ order.customerPhone }}</dd>
        </div>
      </dl>
      <slot name="action" />
      <section
        class="order-detail__section"
        aria-labelledby="order-composition-heading"
      >
        <h3 id="order-composition-heading" class="order-detail__section-title">
          Состав
        </h3>
        <ul class="order-detail__items">
          <li
            v-for="(item, index) in order.items"
            :key="index"
            class="order-detail__item"
          >
            <div class="order-detail__line">
              <strong>{{ item.name }}</strong
              ><span class="order-detail__amount">{{ item.quantity }} шт.</span>
            </div>
            <p v-if="item.portion !== null">{{ item.portion }}</p>
            <ul
              v-if="item.modifiers.length > 0"
              class="order-detail__modifiers"
            >
              <li
                v-for="modifier in item.modifiers"
                :key="modifier.id"
                class="order-detail__line"
              >
                <span>{{ modifier.name }}</span
                ><span class="order-detail__amount">{{
                  formatDelta(modifier.priceDelta)
                }}</span>
              </li>
            </ul>
            <div class="order-detail__line order-detail__prices">
              <span>{{ formatRubles(item.unitTotal) }} за шт.</span
              ><strong class="order-detail__amount">{{
                formatRubles(item.lineTotal)
              }}</strong>
            </div>
          </li>
        </ul>
        <div class="order-detail__line order-detail__sum">
          <strong>Итого</strong
          ><strong class="order-detail__amount">{{
            formatRubles(order.total)
          }}</strong>
        </div>
      </section>
      <section
        class="order-detail__section"
        aria-labelledby="order-history-heading"
      >
        <h3 id="order-history-heading" class="order-detail__section-title">
          История
        </h3>
        <p v-if="order.events.length === 0">Переходов ещё нет</p>
        <ol v-else class="order-detail__history">
          <li
            v-for="(event, index) in order.events"
            :key="index"
            class="order-detail__event"
          >
            <p>{{ stageLabels[event.from] }} → {{ stageLabels[event.to] }}</p>
            <p>{{ event.actorPhone }}</p>
            <time
              class="order-detail__event-time"
              :datetime="event.occurredAt"
              >{{ formatOrderDate(event.occurredAt) }}</time
            >
          </li>
        </ol>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import { stageLabels } from "../../entities/order/order.constants";
import {
  formatOrderDate,
  formatRubles,
} from "../../entities/order/order.format";
import type {
  OrderDetailEmits,
  OrderDetailProps,
  OrderDetailSlots,
} from "./OrderDetail.types";

const props = defineProps<OrderDetailProps>();
const emit = defineEmits<OrderDetailEmits>();

defineSlots<OrderDetailSlots>();
const title = computed(() =>
  props.order === null
    ? props.selected
      ? "Заказ"
      : "Выберите заказ"
    : `Заказ ${props.order.number}`,
);
const initialLoading = computed(() => props.order === null && props.loading);

function formatDelta(value: number) {
  return value > 0 ? `+${formatRubles(value)}` : formatRubles(value);
}
</script>

<style scoped>
.order-detail {
  min-inline-size: 0;
  padding-block: var(--space-sm);
  overflow-wrap: anywhere;
}
.order-detail__heading {
  font-size: var(--font-section-title);
  line-height: var(--line-section-title);
  margin-block-end: var(--space-xl);
}
.order-detail__identity {
  display: grid;
  gap: var(--space-md);
  font-size: var(--font-data);
}
.order-detail__fact {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: var(--space-md);
}
.order-detail__fact dt {
  color: var(--color-foreground-muted);
}
.order-detail__fact dd {
  margin: 0;
}
.order-detail__section {
  margin-block-start: var(--space-xl);
}
.order-detail__section-title {
  font-size: var(--font-body);
  margin-block-end: var(--space-md);
}
.order-detail__items,
.order-detail__modifiers,
.order-detail__history {
  list-style: none;
  padding: 0;
  margin: 0;
}
.order-detail__item {
  padding-block: var(--space-lg);
  border-block-end: var(--border-width) solid var(--color-border);
  display: grid;
  gap: var(--space-sm);
  font-size: var(--font-data);
}
.order-detail__line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-lg);
}
.order-detail__line > :first-child {
  min-inline-size: 0;
}
.order-detail__amount {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.order-detail__modifiers {
  display: grid;
  gap: var(--space-xs);
}
.order-detail__prices,
.order-detail__event-time {
  color: var(--color-foreground-muted);
}
.order-detail__sum {
  padding-block: var(--space-lg);
}
.order-detail__history {
  display: grid;
  gap: var(--space-lg);
}
.order-detail__event {
  border-inline-start: var(--border-width) solid var(--color-border);
  padding-inline-start: var(--space-md);
  font-size: var(--font-data);
}
.order-detail__event-time {
  font-variant-numeric: tabular-nums;
}
.order-detail__feedback {
  display: grid;
  justify-items: start;
  gap: var(--space-sm);
  margin-block-end: var(--space-lg);
  font-size: var(--font-data);
}
.order-detail__error {
  color: var(--color-danger);
}
</style>
