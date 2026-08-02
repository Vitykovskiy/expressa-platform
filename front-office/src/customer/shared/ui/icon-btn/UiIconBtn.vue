<template>
  <button
    v-bind="$attrs"
    class="ui-icon-btn"
    :aria-busy="props.loading || undefined"
    :disabled="props.disabled || props.loading"
    :type="props.type"
    @click="emit('click', $event)"
  >
    <slot v-if="props.loading && $slots.loader" name="loader" />
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { UI_ICON_BTN_DEFAULTS } from "./UiIconBtn.constants";
import type { UiIconBtnEmits, UiIconBtnProps } from "./UiIconBtn.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiIconBtnProps>(), UI_ICON_BTN_DEFAULTS);
const emit = defineEmits<UiIconBtnEmits>();
defineSlots<{
  default(): unknown;
  loader?(): unknown;
}>();
</script>

<style scoped lang="scss">
.ui-icon-btn {
  display: inline-grid;
  min-width: calc(var(--customer-space-12) * 2);
  min-height: calc(var(--customer-space-12) * 2);
  width: var(--customer-size-control-md);
  height: var(--customer-size-control-md);
  padding: 0;
  place-items: center;
  color: var(--customer-color-text-on-brand);
  background: var(--customer-color-surface-subtle);
  border: 1px solid var(--customer-color-border-on-brand);
  border-radius: var(--customer-radius-round);
  cursor: pointer;
  transition: var(--customer-transition-surface);
}

.ui-icon-btn:hover:not(:disabled) {
  background: var(--customer-color-brand-raised);
}

.ui-icon-btn:focus-visible {
  outline: 2px solid var(--customer-color-focus);
  outline-offset: 2px;
}

.ui-icon-btn:active:not(:disabled) {
  transform: var(--customer-transform-press);
}

.ui-icon-btn:disabled {
  cursor: not-allowed;
  opacity: var(--customer-state-disabled-opacity);
}
</style>
