<template>
  <v-btn
    v-if="props.to"
    v-bind="$attrs"
    class="ui-btn"
    :class="{
      'ui-btn--navigation': props.navigation,
      'ui-btn--navigation-forward':
        props.navigation && props.navigationDirection === 'forward',
    }"
    :aria-busy="props.loading || undefined"
    :disabled="props.disabled || props.loading"
    :loading="props.loading"
    :to="props.to"
    :type="props.type"
    @click="emit('click', $event)"
  >
    <template v-if="$slots.loader" #loader>
      <slot name="loader" />
    </template>
    <slot />
  </v-btn>
  <button
    v-else
    v-bind="$attrs"
    class="ui-btn"
    :class="{
      'ui-btn--navigation': props.navigation,
      'ui-btn--navigation-forward':
        props.navigation && props.navigationDirection === 'forward',
    }"
    :aria-busy="props.loading || undefined"
    :disabled="props.disabled || props.loading"
    :type="props.type"
    @click="emit('click', $event)"
  >
    <template v-if="props.loading">
      <slot v-if="$slots.loader" name="loader" />
      <span
        v-else
        aria-label="Загрузка"
        class="ui-btn__progress"
        role="progressbar"
      />
      <span class="ui-btn__label--loading">
        <slot />
      </span>
    </template>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { UI_BTN_DEFAULTS } from "./UiBtn.constants";
import type { UiBtnEmits, UiBtnProps } from "./UiBtn.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiBtnProps>(), UI_BTN_DEFAULTS);
const emit = defineEmits<UiBtnEmits>();
defineSlots<{
  default(): unknown;
  loader?(): unknown;
}>();
</script>

<style scoped lang="scss">
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0;
  color: inherit;
  background: none;
  border: 0;
  border-radius: var(--customer-radius-sm);
  font: inherit;
  cursor: pointer;
}

.ui-btn__label--loading {
  display: block;
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.ui-btn__progress {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--customer-radius-round);
  animation: ui-btn-progress-spin 0.8s linear infinite;
}

@keyframes ui-btn-progress-spin {
  to {
    transform: rotate(360deg);
  }
}

.ui-btn:disabled {
  cursor: not-allowed;
  opacity: var(--customer-state-disabled-opacity);
}

.ui-btn:focus-visible {
  outline: 2px solid var(--customer-focus-ring);
  outline-offset: 2px;
}

.ui-btn[block] {
  width: 100%;
}

.ui-btn[size="x-large"] {
  min-height: var(--customer-size-control-xl);
}

.ui-btn[variant="text"] {
  min-height: 0;
}

.ui-btn--navigation {
  gap: var(--customer-space-5);
  padding: var(--customer-space-5) var(--customer-space-8)
    var(--customer-space-5) var(--customer-space-6);
  color: var(--customer-text);
  background: var(--customer-surface-muted);
  border: 0;
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-extrabold);
}

.ui-btn--navigation-forward {
  padding-right: var(--customer-space-6);
  padding-left: var(--customer-space-8);
}

.ui-btn--navigation :slotted(svg) {
  width: var(--customer-font-size-md);
  height: var(--customer-font-size-md);
}

.ui-btn[color="surface"] {
  color: var(--customer-background);
  background: var(--customer-surface);
}

.ui-btn[color="primary"] {
  color: var(--customer-text);
  background: var(--customer-primary);
}

.ui-btn[color="error"] {
  color: var(--customer-danger);
  background: var(--customer-surface);
}
</style>
