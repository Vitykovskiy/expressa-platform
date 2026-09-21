<template>
  <div
    v-bind="attrs"
    class="filter-tabs"
    :class="`filter-tabs--${props.layout}`"
    role="radiogroup"
    aria-label="Фильтр"
  >
    <div class="filter-tabs__items">
      <button
        v-for="item in props.items"
        :key="item.value"
        class="filter-tab"
        :class="{ 'filter-tab--selected': model === item.value }"
        :aria-checked="model === item.value"
        :data-filter-value="item.value"
        :disabled="props.disabled"
        role="radio"
        :tabindex="focusedValue === item.value ? 0 : -1"
        type="button"
        @click="selectTab(item.value)"
        @focus="focusedValue = item.value"
        @keydown="handleKeydown($event, item.value)"
      >
        <span class="filter-tab__visual">
          <span
            v-if="model === item.value"
            class="filter-tab__check"
            aria-hidden="true"
            >✓</span
          >
          {{ item.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { shallowRef, useAttrs, watch } from "vue";
import type { FilterTabsProps } from "./FilterTabs.types";

export type { FilterTab, FilterTabsLayout } from "./FilterTabs.types";

// VTabs' default 48px tablist cannot preserve this aria-pressed button group.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<FilterTabsProps<T>>(), {
  disabled: false,
  layout: "contained",
});
const model = defineModel<T>({ required: true });
const attrs = useAttrs();
const focusedValue = shallowRef<string>(model.value);

watch(model, (value) => {
  focusedValue.value = value;
});

function selectTab(value: T) {
  if (props.disabled) return;

  model.value = value;
}

function handleKeydown(event: KeyboardEvent, value: T): void {
  const currentIndex = props.items.findIndex((item) => item.value === value);
  if (currentIndex < 0) return;

  let nextIndex: number;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % props.items.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + props.items.length) % props.items.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = props.items.length - 1;
  } else if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    selectTab(value);
    return;
  } else {
    return;
  }

  event.preventDefault();
  const nextValue = props.items[nextIndex]?.value;
  if (!nextValue) return;
  selectTab(nextValue);
  focusedValue.value = nextValue;
  (event.currentTarget as HTMLButtonElement)
    .closest(".filter-tabs__items")
    ?.querySelector<HTMLButtonElement>(`[data-filter-value="${nextValue}"]`)
    ?.focus();
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

.filter-tab__check {
  margin-inline-end: var(--expressa-space-4);
  font-weight: var(--expressa-font-weight-bold);
}

.filter-tab--selected .filter-tab__visual {
  color: var(--expressa-color-text-on-accent);
  background: var(--expressa-color-accent);
}

.filter-tab:disabled {
  cursor: not-allowed;
}

.filter-tab:disabled .filter-tab__visual {
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-control-disabled-surface);
  opacity: var(--expressa-state-disabled-opacity);
}

.filter-tab:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
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
