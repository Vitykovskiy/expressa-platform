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
  padding: var(--expressa-space-sm) 0;
  border-bottom: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
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
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-body);
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
}

.filter-tab__visual {
  display: flex;
  align-items: center;
  padding: var(--expressa-space-sm) var(--expressa-space-md);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
}

.filter-tab--selected .filter-tab__visual {
  border-color: var(--expressa-color-accent);
  color: var(--expressa-color-text-on-accent);
  background-color: var(--expressa-color-accent);
  font-weight: var(--expressa-font-weight-medium);
}

.filter-tab:hover:not(:disabled):not(.filter-tab--selected)
  .filter-tab__visual {
  background: var(--expressa-color-control-hover-surface);
  border-color: var(--expressa-color-border-strong);
}

.filter-tab:disabled {
  cursor: not-allowed;
}

.filter-tab:disabled .filter-tab__visual {
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-control-disabled-surface);
  opacity: var(--expressa-state-disabled-opacity);
}

.filter-tabs--wrapped {
  overflow: visible;
}

.filter-tabs--wrapped .filter-tabs__items {
  flex-wrap: wrap;
  inline-size: 100%;
  min-inline-size: 0;
}

.filter-tabs--wrapped .filter-tab__visual {
  padding-inline: var(--expressa-space-12);
}

.filter-tabs--bounded-wrapped {
  overflow: visible;
  padding: 0;
  border-bottom-width: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
}

.filter-tabs--bounded-wrapped .filter-tabs__items {
  flex-wrap: wrap;
  inline-size: 100%;
  min-inline-size: 0;
}

.filter-tabs--bounded-wrapped .filter-tab {
  min-inline-size: 0;
  max-inline-size: 100%;
  white-space: normal;
  text-align: start;
  overflow-wrap: anywhere;
}

.filter-tabs--bounded-wrapped .filter-tab__visual {
  min-inline-size: 0;
  max-inline-size: 100%;
  padding-inline: var(--expressa-space-12);
}

.filter-tabs--bounded-wrapped
  .filter-tab:not(.filter-tab--selected)
  .filter-tab__visual {
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-transparent);
}

.filter-tabs--balanced-pairs {
  overflow: visible;
}

.filter-tabs--balanced-pairs .filter-tab__visual {
  padding-inline: var(--expressa-space-12);
}

@media (max-width: 374px) {
  .filter-tabs--balanced-pairs .filter-tabs__items {
    display: grid;
    grid-template-columns: repeat(2, max-content);
    inline-size: 100%;
    min-inline-size: 0;
  }

  .filter-tabs--balanced-pairs .filter-tab {
    justify-self: start;
  }
}

@media (min-width: 768px) {
  .filter-tabs--responsive {
    inline-size: 100%;
    min-inline-size: 0;
    max-inline-size: 100%;
    padding-inline: var(--expressa-border-width-none);
    border-bottom-width: var(--expressa-border-width-none);
  }
}
</style>
