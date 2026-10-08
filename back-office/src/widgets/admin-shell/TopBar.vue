<template>
  <header class="top-bar">
    <h1 class="top-bar-title">{{ title }}</h1>
    <AdminButton
      v-if="slots.action"
      class="top-bar-action"
      size="compact"
      :disabled="actionDisabled"
      type="button"
      variant="ghost"
      @click="emit('action')"
    >
      <slot name="action" />
    </AdminButton>
  </header>
</template>

<script setup lang="ts">
import AdminButton from "../../shared/ui/admin/admin-button/AdminButton.vue";
import { TOP_BAR_DEFAULTS } from "./TopBar.constants";
import type { TopBarEmits, TopBarProps } from "./TopBar.types";

withDefaults(defineProps<TopBarProps>(), TOP_BAR_DEFAULTS);
const emit = defineEmits<TopBarEmits>();
const slots = defineSlots<{ action?(): unknown }>();
</script>

<style scoped lang="scss">
.top-bar {
  position: relative;
  display: flex;
  min-height: var(--expressa-size-top-bar-min-height);
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-safe-area-top) var(--expressa-space-md) 0;
  background: var(--expressa-color-surface);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.top-bar-title {
  min-width: 0;
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
}
.top-bar-action {
  flex-shrink: 0;
}
@media (min-width: 768px) {
  .top-bar {
    display: none;
  }
}
</style>
