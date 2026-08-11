<template>
  <div
    v-bind="attrs"
    class="filter-tabs"
    :class="`filter-tabs--${props.layout}`"
    role="group"
    aria-label="Фильтр"
  >
    <div class="filter-tabs__items">
      <button
        v-for="item in props.items"
        :key="item.value"
        class="filter-tab"
        :class="{ 'filter-tab--selected': model === item.value }"
        :aria-pressed="model === item.value"
        type="button"
        @click="selectTab(item.value)"
      >
        <span class="filter-tab__visual">{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { useAttrs } from "vue";
import type { FilterTabsProps } from "./FilterTabs.types";

export type { FilterTab, FilterTabsLayout } from "./FilterTabs.types";

// VTabs' default 48px tablist cannot preserve this aria-pressed button group.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<FilterTabsProps<T>>(), {
  layout: "contained",
});
const model = defineModel<T>({ required: true });
const attrs = useAttrs();

function selectTab(value: T) {
  model.value = value;
}
</script>

<style scoped lang="scss">
.filter-tabs {
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
  max-inline-size: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--expressa-space-sm) var(--expressa-space-md) 7.5px;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  scroll-padding-inline: var(--expressa-space-md);
}

.filter-tabs__items {
  display: flex;
  gap: var(--expressa-space-sm);
  inline-size: max-content;
  min-inline-size: max-content;
}

.filter-tab {
  display: grid;
  min-height: var(--expressa-size-control-min-height);
  flex: 0 0 auto;
  align-items: start;
  justify-items: center;
  padding: var(--expressa-space-xs) var(--expressa-border-width-none);
  border: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
  cursor: pointer;
  font: inherit;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
}

.filter-tab__visual {
  display: flex;
  align-items: center;
  padding: var(--expressa-space-sm) var(--expressa-space-md);
  border-radius: var(--expressa-radius-pill);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface-raised);
}

.filter-tab--selected .filter-tab__visual {
  color: var(--expressa-color-text-on-accent);
  background: var(--expressa-color-accent);
}

.filter-tab:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}

@media (min-width: 768px) {
  .filter-tabs--responsive {
    inline-size: max-content;
    min-inline-size: max-content;
    max-inline-size: none;
    padding-inline: var(--expressa-border-width-none);
    border-bottom-width: var(--expressa-border-width-none);
  }
}
</style>
