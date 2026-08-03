<template>
  <nav
    aria-label="Разделы администратора"
    class="tab-bar"
    :class="{ 'tab-bar--five-sections': props.sections.length === 5 }"
  >
    <AdminButton
      v-for="section in props.sections"
      :key="section.id"
      class="tab-bar-link"
      :aria-current="section.id === props.activeSection ? 'page' : undefined"
      :class="{ 'tab-bar-link--active': section.id === props.activeSection }"
      type="button"
      variant="ghost"
      @click="emit('select', section.id)"
    >
      {{ section.label }}
    </AdminButton>
  </nav>
</template>

<script setup lang="ts">
import AdminButton from "../shared/ui/admin-button/AdminButton.vue";
import type { TabBarEmits, TabBarProps } from "./TabBar.types";

const props = defineProps<TabBarProps>();
const emit = defineEmits<TabBarEmits>();
</script>

<style scoped lang="scss">
.tab-bar {
  display: grid;
  grid-auto-rows: var(--expressa-size-tab-bar-min-height);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: var(--expressa-size-tab-bar-min-height);
  padding-bottom: var(--expressa-safe-area-bottom);
  background: var(--expressa-color-surface);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.tab-bar-link {
  min-width: 0;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-sm) var(--expressa-space-xs);
  border: var(--expressa-border-width-none);
  color: var(--expressa-color-text-muted);
  background: var(--expressa-color-transparent);
  font: inherit;
  font-size: var(--expressa-font-size-caption);
  cursor: pointer;
  white-space: nowrap;
}

.tab-bar-link--active {
  background: var(--expressa-color-control-selected-surface);
  color: var(--expressa-color-accent);
}

.tab-bar--five-sections {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.tab-bar--five-sections .tab-bar-link {
  grid-column: span 2;
}

.tab-bar--five-sections .tab-bar-link:nth-child(n + 4) {
  grid-column: span 3;
}

@media (min-width: 480px) {
  .tab-bar--five-sections {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .tab-bar--five-sections .tab-bar-link,
  .tab-bar--five-sections .tab-bar-link:nth-child(n + 4) {
    grid-column: auto;
  }
}

@media (min-width: 768px) {
  .tab-bar {
    display: none;
  }
}
</style>
