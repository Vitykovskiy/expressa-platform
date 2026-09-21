<template>
  <section class="orders-screen" aria-label="Очередь заказов">
    <TopBar
      :action-disabled="queueControlsDisabled"
      action-label="Обновить очередь"
      title="Заказы"
      @action="emit('refresh')"
    >
      <template v-if="props.status !== 'error'" #action>
        <RefreshCw :size="22" aria-hidden="true" />
      </template>
    </TopBar>

    <div class="orders-screen__toolbar">
      <h1 id="orders-title" class="orders-screen__title">Заказы</h1>
      <FilterTabs
        v-model="stageModel"
        class="orders-screen__filters"
        :disabled="queueControlsDisabled"
        :items="queueFilters"
        layout="responsive"
      />
      <div class="orders-screen__search">
        <label class="orders-screen__field-label" for="orders-search">
          Номер заказа
        </label>
        <AdminTextField
          id="orders-search"
          :disabled="queueControlsDisabled"
          :model-value="props.search"
          placeholder="Введите номер"
          type="search"
          @update:model-value="emit('update:search', $event)"
        />
      </div>
    </div>

    <div class="orders-screen__content">
      <p
        v-if="props.refreshError"
        class="orders-screen__refresh-error"
        role="status"
      >
        Не удалось обновить очередь. Показаны последние полученные данные.
      </p>
      <div
        v-if="props.status === 'loading'"
        class="orders-screen__loading-state"
      >
        <p class="orders-screen__loading-label" role="status">
          Загружаем очередь заказов…
        </p>
        <div
          class="orders-screen__grid"
          aria-busy="true"
          aria-label="Загрузка очереди"
        >
          <div
            v-for="index in 5"
            :key="index"
            class="orders-screen__skeleton"
            aria-hidden="true"
          />
        </div>
      </div>
      <AdminRequestStatePanel
        v-else-if="props.status === 'error' && props.error !== null"
        :action-label="recoveryLabel"
        :announcement-mode="props.errorFocus ? 'alert' : 'none'"
        :body="errorGuidance"
        :code="props.error.code"
        :focus-on-appear="props.errorFocus"
        :pending="props.accessRecoveryPending"
        :pending-label="isAuthorizationError ? 'Переходим…' : 'Повторяем…'"
        :request-id="props.error.requestId ?? ''"
        :title="errorTitle"
        @action="recoverQueue"
      />
      <EmptyState
        v-else-if="props.orders.length === 0"
        :description="emptyContent.description"
        :title="emptyContent.title"
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
          :details-error="
            props.selectedOrderId === order.id ? props.detailsError : null
          "
          :details-loading="
            props.selectedOrderId === order.id && props.detailsLoading
          "
          :order="order"
          :transition-loading="
            props.selectedOrderId === order.id &&
            (props.transitionLoading ||
              props.transitionRecoveryPending ||
              props.requiresTransitionRecovery)
          "
          @open="emit('open', $event)"
          @transition="emit('transition')"
        />
      </div>
    </div>
    <div
      v-if="props.actionError !== null"
      class="orders-screen__action-error"
      role="alert"
    >
      {{ actionErrorGuidance }}
      <AdminButton
        v-if="props.requiresTransitionRecovery"
        :disabled="props.transitionRecoveryPending"
        variant="secondary"
        @click="emit('recover-transition')"
      >
        {{
          props.transitionRecoveryPending
            ? "Проверяем состояние заказа…"
            : "Проверить состояние заказа"
        }}
      </AdminButton>
      <details class="orders-screen__diagnostics">
        <summary>Для поддержки</summary>
        <dl>
          <div>
            <dt>Код ошибки</dt>
            <dd>{{ props.actionError.code }}</dd>
          </div>
          <div v-if="props.actionError.requestId">
            <dt>Код запроса</dt>
            <dd>{{ props.actionError.requestId }}</dd>
          </div>
        </dl>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ClipboardCheck, RefreshCw } from "lucide-vue-next";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminRequestStatePanel from "../../../shared/ui/admin/request-state-panel/AdminRequestStatePanel.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import EmptyState from "../../../shared/ui/admin/empty-state/EmptyState.vue";
import FilterTabs from "../../../shared/ui/admin/filter-tabs/FilterTabs.vue";
import TopBar from "../../../widgets/admin-shell/TopBar.vue";
import OrderCard from "./OrderCard.vue";
import { queueEmptyContent, queueFilters } from "./OrdersScreen.constants";
import type {
  OrdersScreenEmits,
  OrdersScreenProps,
  QueueFilter,
} from "./OrdersScreen.types";

const props = defineProps<OrdersScreenProps>();
const emit = defineEmits<OrdersScreenEmits>();
const queueControlsDisabled = computed(() => props.accessRecoveryPending);
const stageModel = computed<QueueFilter>({
  get: () => props.stage,
  set: (stage) => emit("update:stage", stage),
});
const emptyContent = computed(() => {
  if (props.search !== "" && props.stage !== "ALL") {
    return queueEmptyContent.searchAndStage;
  }

  if (props.search !== "") return queueEmptyContent.search;
  if (props.stage !== "ALL") return queueEmptyContent.stage;

  return queueEmptyContent.global;
});
const isAuthorizationError = computed(() => props.requiresAccessRecovery);
const isPermissionError = computed(() => props.error?.status === 403);
const errorTitle = computed(() =>
  props.error?.code === "LOGIN_NAVIGATION_ERROR"
    ? "Не удалось загрузить данные"
    : isPermissionError.value
      ? "Нет доступа к разделу"
      : isAuthorizationError.value
        ? "Сессия завершена"
        : "Не удалось загрузить данные",
);
const actionErrorGuidance = computed(() =>
  props.requiresTransitionRecovery
    ? "Не удалось подтвердить изменение заказа. Проверьте его текущее состояние, прежде чем повторять действие."
    : "Не удалось изменить состояние заказа. Проверьте текущее состояние заказа.",
);
const recoveryLabel = computed(() =>
  props.accessRecoveryPending
    ? "Восстанавливаем доступ…"
    : isPermissionError.value
      ? "Вернуться назад"
      : isAuthorizationError.value
        ? "Войти снова"
        : "Повторить",
);
const errorGuidance = computed(() =>
  props.error?.code === "LOGIN_NAVIGATION_ERROR"
    ? "Не удалось открыть страницу входа. Повторите попытку."
    : isAuthorizationError.value
      ? "Войдите снова, чтобы загрузить очередь заказов."
      : isPermissionError.value
        ? "Обратитесь к администратору, чтобы получить доступ."
        : "Проверьте подключение к интернету и повторите попытку.",
);

function recoverQueue(): void {
  if (isPermissionError.value) {
    emit("go-back");
    return;
  }
  if (isAuthorizationError.value) {
    emit("restore-access");
    return;
  }

  emit("refresh");
}
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
  order: 0;
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
.orders-screen__content > :deep(.request-state-panel) {
  margin-top: var(--expressa-space-24);
}
.orders-screen__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--expressa-space-md);
}
.orders-screen__loading-state {
  display: grid;
  gap: var(--expressa-space-sm);
}
.orders-screen__loading-label {
  margin: 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
}
.orders-screen__skeleton {
  min-height: 192px;
  border-radius: var(--expressa-radius-lg);
  background: linear-gradient(
    90deg,
    var(--expressa-color-surface) 0%,
    var(--expressa-color-surface-raised) 50%,
    var(--expressa-color-surface) 100%
  );
  background-size: 200% 100%;
  box-shadow: var(--expressa-shadow-card);
  animation: orders-screen-skeleton-shimmer 1s ease-in-out infinite;
}
@keyframes orders-screen-skeleton-shimmer {
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .orders-screen__skeleton {
    animation: none;
  }
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
  border-left: var(--expressa-border-width-strong) solid
    var(--expressa-color-status-error);
}
.orders-screen__state--error h2 {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  line-height: var(--expressa-line-height-title);
}
.orders-screen__state--error p,
.orders-screen__diagnostics {
  margin: 0;
  color: var(--expressa-color-text-secondary);
}
.orders-screen__diagnostics {
  padding-top: var(--expressa-space-xs);
}
.orders-screen__diagnostics dl {
  display: grid;
  gap: var(--expressa-space-sm);
  margin: var(--expressa-space-sm) 0 0;
}
.orders-screen__diagnostics dl div {
  display: grid;
  gap: var(--expressa-space-xs);
}
.orders-screen__diagnostics dt,
.orders-screen__diagnostics dd {
  margin: 0;
}
.orders-screen__diagnostics dt {
  font-weight: var(--expressa-font-weight-medium);
}
.orders-screen__action-error {
  color: var(--expressa-color-status-error);
}
.orders-screen__retry {
  justify-self: start;
}
.orders-screen__diagnostics dd {
  overflow-wrap: anywhere;
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
@media (min-width: 768px) {
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
@media (min-width: 1200px) {
  .orders-screen__toolbar {
    grid-template-columns: minmax(0, 1fr) minmax(200px, 320px);
  }
}
</style>
