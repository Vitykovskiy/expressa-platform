<template>
  <section class="orders-screen">
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
      <div class="orders-screen__search-row">
        <AdminFieldWrapper
          id="orders-search"
          v-slot="field"
          class="orders-screen__search"
          label="Номер заказа"
        >
          <AdminTextField
            :id="field.controlId"
            :disabled="queueControlsDisabled"
            :model-value="props.search"
            :required="field.required"
            type="search"
            @update:model-value="emit('update:search', $event)"
          />
        </AdminFieldWrapper>
      </div>
      <div class="orders-screen__filter-row">
        <FilterTabs
          v-model="stageModel"
          :disabled="queueControlsDisabled"
          :items="queueFilters"
          layout="wrapped"
        />
      </div>
    </div>

    <div class="orders-screen__content">
      <div
        v-if="props.status === 'loading'"
        class="orders-screen__loading-state"
      >
        <AdminProgress label="Загружаем очередь заказов…" />
        <div class="orders-screen__grid">
          <div
            v-for="index in 5"
            :key="index"
            class="orders-screen__skeleton"
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

<style scoped>
.orders-screen {
  display: flex;
  min-height: 100%;
  min-width: 0;
  max-width: var(--expressa-size-workspace-max-width);
  margin-inline: auto;
  padding: var(--expressa-space-screen-gutter);
  flex-direction: column;
  container-type: inline-size;
}
.orders-screen__toolbar {
  display: grid;
  gap: var(--expressa-space-sm);
}
.orders-screen__search-row,
.orders-screen__filter-row,
.orders-screen__search {
  min-inline-size: 0;
}
.orders-screen__search {
  max-inline-size: var(--expressa-size-search-max-width);
}
.orders-screen__content {
  flex: 1 1 auto;
  min-height: 0;
  padding-block: var(--expressa-space-24);
}
.orders-screen__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: var(--expressa-space-16);
}
.orders-screen__loading-state {
  display: grid;
  gap: var(--expressa-space-sm);
}
.orders-screen__skeleton {
  min-height: var(--expressa-size-row-min);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
}
@container (min-width: 800px) {
  .orders-screen__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
