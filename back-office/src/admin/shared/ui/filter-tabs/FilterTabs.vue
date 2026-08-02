<template>
  <div class="filter-tabs" role="group" aria-label="Фильтр">
    <v-btn
      v-for="item in props.items"
      :key="item.value"
      class="filter-tab"
      :class="{ 'filter-tab--selected': model === item.value }"
      :aria-pressed="model === item.value"
      :variant="model === item.value ? 'flat' : 'tonal'"
      :color="model === item.value ? 'primary' : 'secondary'"
      @click="selectTab(item.value)"
    >
      {{ item.label }}
    </v-btn>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import type { FilterTabsProps } from "./FilterTabs.types";

export type { FilterTab } from "./FilterTabs.types";

const props = defineProps<FilterTabsProps<T>>();
const model = defineModel<T>({ required: true });

function selectTab(value: T) {
  model.value = value;
}
</script>

<style scoped lang="scss">
.filter-tabs {
  display: flex;
  gap: var(--expressa-space-sm);
  overflow-x: auto;
  padding: var(--expressa-space-sm) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.filter-tab {
  min-height: var(--expressa-size-control-min-height);
  flex: 0 0 auto;
  border-radius: var(--expressa-radius-pill);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
}

.filter-tab--selected {
  color: var(--expressa-color-text-on-accent);
}

.filter-tab:not(.filter-tab--selected) {
  color: var(--expressa-color-text-secondary);
}

.filter-tab:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}
</style>
