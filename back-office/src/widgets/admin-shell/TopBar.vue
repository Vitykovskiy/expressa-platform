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

<style scoped>
.top-bar {
  display: flex;
  min-height: var(--expressa-size-top-bar-min-height);
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-16);
  margin-bottom: var(--expressa-space-16);
}
.top-bar-title {
  min-width: 0;
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-heading);
}
.top-bar-action {
  flex-shrink: 0;
}
</style>
