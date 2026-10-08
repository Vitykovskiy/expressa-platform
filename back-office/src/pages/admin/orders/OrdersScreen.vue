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
      <header class="orders-screen__desktop-heading">
        <h1 id="orders-title" class="orders-screen__title">Заказы</h1>
        <AdminButton variant="ghost" @click="emit('refresh')">
          <AdminIcon :icon="RefreshCw" />
        </AdminButton>
      </header>
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

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
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
  padding-top: var(--expressa-space-md);
  background: var(--expressa-color-surface);
}
.orders-screen__desktop-heading {
  display: none;
}
.orders-screen__title {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-heading);
}
.orders-screen__search-row {
  min-inline-size: 0;
  padding-inline: var(--expressa-space-md);
}
.orders-screen__search {
  min-inline-size: 0;
}
.orders-screen__filter-row {
  min-inline-size: 0;
}
.orders-screen__content {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--expressa-space-md) var(--expressa-space-md)
    var(--expressa-space-tab-bar-clearance);
}
.orders-screen__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: var(--expressa-space-md);
}
.orders-screen__loading-state {
  display: grid;
  gap: var(--expressa-space-sm);
}
.orders-screen__skeleton {
  min-height: var(--expressa-size-row-min);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface-subtle);
  animation: orders-screen-skeleton-pulse
    var(--expressa-motion-duration-disclosure) var(--expressa-motion-ease-state)
    infinite alternate;
}
@keyframes orders-screen-skeleton-pulse {
  to {
    opacity: var(--expressa-state-disabled-opacity);
  }
}
@media (min-width: 768px) {
  .orders-screen {
    background: var(--expressa-color-surface);
  }
  .orders-screen__toolbar {
    gap: var(--expressa-space-sm);
    padding-top: var(--expressa-space-lg);
  }
  .orders-screen__desktop-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--expressa-space-md);
    padding-inline: var(--expressa-space-lg);
  }
  .orders-screen__search-row {
    padding-inline: var(--expressa-space-lg);
  }
  .orders-screen__search {
    /* Search stays bounded using the existing auth-field measure, not a new scale. */
    max-inline-size: var(--expressa-size-auth-card-max-width);
  }
  .orders-screen__filter-row {
    /* FilterTabs owns its 16px inner gutter; compose it with the list's 24px gutter. */
    padding-inline: calc(var(--expressa-space-lg) - var(--expressa-space-md));
  }
  .orders-screen__content {
    padding: var(--expressa-space-lg);
  }
  .orders-screen__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
