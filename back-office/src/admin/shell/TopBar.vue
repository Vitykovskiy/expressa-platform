<template>
  <header class="top-bar">
    <h1>{{ title }}</h1>
    <AdminButton
      v-if="$slots.action"
      :aria-label="actionLabel"
      class="top-bar-action"
      type="button"
      variant="ghost"
      @click="emit('action')"
    >
      <slot name="action" />
    </AdminButton>
  </header>
</template>

<script setup lang="ts">
import AdminButton from "../shared/ui/admin-button/AdminButton.vue";
import { TOP_BAR_DEFAULTS } from "./TopBar.constants";
import type { TopBarEmits, TopBarProps } from "./TopBar.types";

withDefaults(defineProps<TopBarProps>(), TOP_BAR_DEFAULTS);
const emit = defineEmits<TopBarEmits>();
</script>

<style scoped lang="scss">
.top-bar {
  display: flex;
  min-height: var(--expressa-size-top-bar-min-height);
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--expressa-space-md);
  background: var(--expressa-color-surface);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.top-bar h1 {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
}
.top-bar-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
  padding: 0;
  border: var(--expressa-border-width-none);
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
  font: inherit;
  cursor: pointer;
}
@media (min-width: 768px) {
  .top-bar {
    display: none;
  }
}
</style>
