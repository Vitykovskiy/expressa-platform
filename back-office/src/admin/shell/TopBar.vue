<template>
  <header class="top-bar">
    <h2 class="top-bar-title">{{ title }}</h2>
    <AdminButton
      v-if="slots.action"
      :aria-label="actionLabel"
      class="top-bar-action"
      type="button"
      variant="ghost"
      @click="emit('action')"
    >
      <span class="top-bar-action__icon">
        <slot name="action" />
      </span>
    </AdminButton>
  </header>
</template>

<script setup lang="ts">
import AdminButton from "../shared/ui/admin-button/AdminButton.vue";
import { TOP_BAR_DEFAULTS } from "./TopBar.constants";
import type { TopBarEmits, TopBarProps } from "./TopBar.types";

withDefaults(defineProps<TopBarProps>(), TOP_BAR_DEFAULTS);
const emit = defineEmits<TopBarEmits>();
const slots = defineSlots<{ action?(): unknown }>();
</script>

<style scoped lang="scss">
.top-bar {
  --top-bar-action-icon-size: 22px;

  position: relative;
  display: flex;
  min-height: var(--expressa-size-top-bar-min-height);
  align-items: center;
  justify-content: space-between;
  padding: var(--expressa-safe-area-top)
    calc(
      var(--expressa-space-md) -
        (
          var(--expressa-size-control-min-height) - var(
              --top-bar-action-icon-size
            )
        ) /
        2
    )
    0 var(--expressa-space-md);
  background: var(--expressa-color-surface);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.top-bar-title {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: 28px;
}
.top-bar-action {
  display: flex;
  width: var(--expressa-size-control-min-height);
  height: var(--expressa-size-control-min-height);
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: var(--expressa-border-width-none);
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
  font: inherit;
  cursor: pointer;
}
.top-bar-action__icon {
  display: block;
  width: var(--top-bar-action-icon-size);
  height: var(--top-bar-action-icon-size);
}
@media (min-width: 768px) {
  .top-bar {
    display: none;
  }
}
</style>
