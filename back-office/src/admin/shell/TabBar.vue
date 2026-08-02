<template>
  <nav aria-label="Разделы администратора" class="tab-bar">
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
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  min-height: var(--expressa-size-tab-bar-min-height);
  padding-bottom: var(--expressa-safe-area-bottom);
  background: var(--expressa-color-surface);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.tab-bar-link {
  min-width: 0;
  flex: 1;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-sm) var(--expressa-space-xs);
  border: var(--expressa-border-width-none);
  border-top: var(--expressa-border-width-strong) solid
    var(--expressa-color-transparent);
  color: var(--expressa-color-text-muted);
  background: var(--expressa-color-transparent);
  font: inherit;
  font-size: var(--expressa-font-size-caption);
  cursor: pointer;
  overflow-wrap: anywhere;
}

.tab-bar-link--active {
  border-top-color: var(--expressa-color-accent);
  color: var(--expressa-color-accent);
}

@media (min-width: 768px) {
  .tab-bar {
    display: none;
  }
}
</style>
