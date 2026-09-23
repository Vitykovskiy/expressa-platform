<template>
  <div
    v-bind="attrs"
    class="filter-tabs"
    :class="`filter-tabs--${props.layout}`"
  >
    <div class="filter-tabs__items">
      <button
        v-for="item in props.items"
        :key="item.value"
        class="filter-tab"
        :class="{ 'filter-tab--selected': model === item.value }"
        :data-filter-value="item.value"
        :disabled="props.disabled"
        type="button"
        @click="selectTab(item.value)"
      >
        <span class="filter-tab__visual">
          {{ item.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { useAttrs } from "vue";
import type { FilterTabsProps } from "./FilterTabs.types";

export type { FilterTab, FilterTabsLayout } from "./FilterTabs.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<FilterTabsProps<T>>(), {
  disabled: false,
  layout: "contained",
});
const model = defineModel<T>({ required: true });
const attrs = useAttrs();

function selectTab(value: T) {
  if (props.disabled) return;

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
  padding: var(--expressa-space-12) var(--expressa-space-md);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-surface);
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
  align-items: center;
  justify-items: center;
  padding: var(--expressa-border-width-none);
  border: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
  cursor: pointer;
  font: inherit;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-regular);
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
}

.filter-tab__visual {
  display: flex;
  align-items: center;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-sm) var(--expressa-space-md);
  border: var(--expressa-border-width-none);
  border-radius: var(--expressa-radius-pill);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface-subtle);
}

.filter-tab--selected .filter-tab__visual {
  border-color: var(--expressa-color-accent);
  color: var(--expressa-color-text-on-accent);
  background-color: var(--expressa-color-accent);
  font-weight: var(--expressa-font-weight-medium);
}

.filter-tab:disabled {
  cursor: not-allowed;
}

.filter-tab:disabled .filter-tab__visual {
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-control-disabled-surface);
  opacity: var(--expressa-state-disabled-opacity);
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
