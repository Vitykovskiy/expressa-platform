<template>
  <article class="order-card" :aria-busy="props.pending">
    <header class="order-card__identity">
      <button
        class="order-card__number"
        type="button"
        :aria-expanded="props.expanded"
        :aria-label="`Заказ ${props.order.number}: подробности`"
        @click="emit('toggleDetails', props.order.id)"
      >
        {{ props.order.number }}
      </button>
      <OperationsBadge :label="stageLabel" :tone="props.order.stage" />
    </header>
    <div class="order-card__pickup">
      <img :src="ORDER_CLOCK_ICON" alt="" />
      <span>{{ props.order.pickupTime }}</span>
    </div>
    <div class="order-card__customer">
      <h2 class="order-card__name">{{ props.order.customerName }}</h2>
      <p class="order-card__items">{{ props.order.itemsSummary }}</p>
    </div>
    <p class="order-card__total">{{ props.order.totalLabel }}</p>
    <div v-if="actionable" class="order-card__actions">
      <template v-if="props.order.stage === 'created'">
        <OperationsButton
          class="order-card__action"
          label="Подтвердить"
          :disabled="unavailable"
          @click="emit('confirm', props.order.id)"
        />
        <OperationsButton
          class="order-card__action"
          label="Отклонить"
          kind="destructive"
          :disabled="unavailable"
          @click="emit('reject', props.order.id)"
        />
      </template>
      <OperationsButton
        v-else-if="props.order.stage === 'confirmed'"
        class="order-card__action"
        label="Готово к выдаче"
        :disabled="unavailable"
        @click="emit('ready', props.order.id)"
      />
      <OperationsButton
        v-else-if="props.order.stage === 'ready'"
        class="order-card__action"
        label="Выдать заказ"
        :disabled="unavailable"
        @click="emit('issue', props.order.id)"
      />
    </div>
    <p v-if="props.pending" class="order-card__pending" role="status">
      Выполняем…
    </p>
    <section
      v-if="props.expanded"
      class="order-card__details"
      aria-label="Состав и история заказа"
    >
      <p class="order-card__detail-copy">{{ props.order.details.phone }}</p>
      <p class="order-card__detail-copy">
        Создан: {{ props.order.details.createdAt }}
      </p>
      <p class="order-card__detail-copy">
        Получение: {{ props.order.details.pickup }}
      </p>
      <ul class="order-card__detail-list" aria-label="Сохранённый состав">
        <li
          v-for="line in props.order.details.lines"
          :key="line.key"
          class="order-card__detail-line"
        >
          <span>{{ line.label }} · {{ line.total }}</span>
          <span v-if="line.modifiers" class="order-card__detail-copy">{{
            line.modifiers
          }}</span>
        </li>
      </ul>
      <h3 class="order-card__detail-heading">История</h3>
      <p
        v-if="props.order.details.events.length === 0"
        class="order-card__detail-copy"
      >
        Переходов ещё нет
      </p>
      <ol v-else class="order-card__detail-list">
        <li
          v-for="event in props.order.details.events"
          :key="event.key"
          class="order-card__detail-copy"
        >
          {{ event.label }}
        </li>
      </ol>
      <p v-if="props.order.details.rejection" class="order-card__detail-copy">
        {{ props.order.details.rejection }}
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OperationsBadge from "../../../shared/ui/operations/OperationsBadge.vue";
import OperationsButton from "../../../shared/ui/operations/OperationsButton.vue";
import { ORDER_CLOCK_ICON, ORDER_STAGE_LABELS } from "./OrderCard.constants";
import type { OrderCardProps, OrderCardEmits } from "./OrderCard.types";

const props = defineProps<OrderCardProps>();
const emit = defineEmits<OrderCardEmits>();

const stageLabel = computed(() => ORDER_STAGE_LABELS[props.order.stage]);
const unavailable = computed(() => props.disabled || props.pending);

const actionable = computed(
  () => props.order.stage !== "closed" && props.order.stage !== "rejected",
);
</script>

<style scoped>
/* Шрифт номера и его URL принадлежат карточке; общий Inter не заменяет моноширинный номер. */
@font-face {
  font-family: "Fira Mono";
  src: url("/orders/FiraMono-Medium.ttf") format("truetype");
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}

/* Локальная плотность карточки и её тень не имеют product tokens; цвета и радиус берём из темы. */
.order-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
  color: var(--color-foreground);
}

/* Геометрия шапки, номер и строка получения сохраняют локальные размеры и интервалы. */
.order-card__identity {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.order-card__number {
  min-width: 0;
  margin: 0;
  color: var(--color-foreground-muted);
  font-family: "Fira Mono", monospace;
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
  overflow-wrap: anywhere;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.order-card__pickup {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-top: 8px;
  color: var(--color-foreground-muted);
  font-size: 12px;
  line-height: 16px;
}
.order-card__customer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0 8px;
}

/* Общей шкалы типографики нет: иерархия имени, суммы и состава ограничена карточкой. */
.order-card__name,
.order-card__total {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 22.5px;
  overflow-wrap: anywhere;
}
.order-card__items {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.order-card__actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
}

/* Кнопки делят ширину карточки; интервалы и подпись ожидания не задают общую сетку приложения. */
.order-card__action {
  flex: 1;
  min-width: 0;
}
.order-card__pending {
  margin: 8px 0 0;
  color: var(--color-foreground-muted);
  font-size: 12px;
  line-height: 16px;
}

/* Подробности сохраняют собственные отступы, списки и текстовые уровни без новых theme tokens. */
.order-card__details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  overflow-wrap: anywhere;
}
.order-card__detail-copy {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
}
.order-card__detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding-left: 16px;
}
.order-card__detail-line {
  font-size: 14px;
  line-height: 20px;
}
.order-card__detail-line > span {
  display: block;
}
.order-card__detail-heading {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}
</style>
