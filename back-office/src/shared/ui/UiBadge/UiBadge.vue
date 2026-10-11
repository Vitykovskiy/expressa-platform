<template>
  <span class="ui-badge" :class="toneClass"><slot /></span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { badgeDefaults } from "./UiBadge.constants";
import type { UiBadgeProps, UiBadgeSlots } from "./UiBadge.types";

const props = withDefaults(defineProps<UiBadgeProps>(), badgeDefaults);

defineSlots<UiBadgeSlots>();

const toneClass = computed(() => `ui-badge--${props.tone}`);
</script>

<style scoped>
.ui-badge {
  display: inline-block;
  max-inline-size: 100%;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-badge);
  background: var(--color-surface-muted);
  color: var(--color-foreground-muted);
  font-size: var(--font-label);
  line-height: var(--line-label);
  overflow-wrap: anywhere;
}
.ui-badge--warning {
  background: var(--color-warning-muted);
  color: var(--color-warning);
}
.ui-badge--danger {
  background: var(--color-danger-muted);
  color: var(--color-danger);
}
</style>
