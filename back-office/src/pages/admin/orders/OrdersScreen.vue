<template>
  <section class="orders-screen" aria-label="Очередь заказов">
    <TopBar
      :action-disabled="queueControlsDisabled"
      action-label="Обновить очередь"
      title="Заказы"
      @action="emit('refresh')"
    >
      <template #action>
        <AdminIcon :icon="RefreshCw" />
      </template>
    </TopBar>

    <div class="orders-screen__toolbar">
      <h1 id="orders-title" class="orders-screen__title">Заказы</h1>
      <FilterTabs
        v-model="stageModel"
        class="orders-screen__filters"
        :disabled="queueControlsDisabled"
        :items="queueFilters"
        layout="contained"
      />
      <AdminFieldWrapper
        id="orders-search"
        v-slot="field"
        class="orders-screen__search"
        label="Номер заказа"
      >
        <AdminTextField
          :id="field.controlId"
          :aria-describedby="field.describedBy"
          :aria-invalid="field.invalid"
          :aria-required="field.required"
          :disabled="queueControlsDisabled"
          :model-value="props.search"
          :required="field.required"
          type="search"
          @update:model-value="emit('update:search', $event)"
        />
      </AdminFieldWrapper>
    </div>

    <div class="orders-screen__content">
      <div
        v-if="props.status === 'loading'"
        class="orders-screen__loading-state"
      >
        <AdminProgress label="Загружаем очередь заказов…" />
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
      <EmptyState
        v-else-if="props.status === 'unresolved'"
        title="Очередь пока недоступна"
      >
        <template #icon>
          <AdminIcon :icon="ClipboardCheck" />
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="props.orders.length === 0"
        :title="emptyContent.title"
      >
        <template #icon>
          <AdminIcon :icon="ClipboardCheck" />
        </template>
      </EmptyState>
      <div v-else class="orders-screen__grid">
        <OrderCard
          v-for="order in props.orders"
          :key="order.id"
          :details="props.selectedOrderId === order.id ? props.details : null"
          :details-loading="
            props.selectedOrderId === order.id && props.detailsLoading
          "
          :order="order"
          :transition-loading="
            props.selectedOrderId === order.id &&
            (props.transitionLoading || props.requiresTransitionRecovery)
          "
          @open="emit('open', $event)"
          @transition="emit('transition')"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ClipboardCheck, RefreshCw } from "lucide-vue-next";

import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminProgress from "../../../shared/ui/admin/admin-progress/AdminProgress.vue";
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
const queueControlsDisabled = computed(() => false);
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
  min-inline-size: 0;
  max-inline-size: 100%;
  order: 1;
}
.orders-screen__search {
  display: grid;
  order: 0;
  gap: var(--expressa-space-field-label);
  padding: 0 var(--expressa-space-md) var(--expressa-space-md);
}
.orders-screen__content {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--expressa-space-md) var(--expressa-space-md)
    var(--expressa-space-tab-bar-clearance);
}
.orders-screen__recovery {
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
  min-height: var(--expressa-size-row-min);
  border-radius: var(--expressa-radius-lg);
  background: linear-gradient(
    90deg,
    var(--expressa-color-surface) 0%,
    var(--expressa-color-surface-raised) 50%,
    var(--expressa-color-surface) 100%
  );
  background-size: 200% 100%;
}
.orders-screen__state,
.orders-screen__action-error {
  display: grid;
  gap: var(--expressa-space-sm);
  margin: 0;
  padding: var(--expressa-space-md);
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface);
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
.orders-screen__state--error p {
  margin: 0;
  color: var(--expressa-color-text-secondary);
}
.orders-screen__action-error {
  color: var(--expressa-color-status-error);
}
.orders-screen__retry {
  justify-self: start;
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
    display: flex;
    flex-wrap: wrap;
    align-items: end;
  }
  .orders-screen__title {
    width: 100%;
  }
  .orders-screen__filters {
    flex: 1 1 0;
  }
  .orders-screen__search {
    min-inline-size: 0;
    flex: 1 1 0;
  }
}
</style>
