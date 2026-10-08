<template>
  <div
    class="toggle-row"
    :class="{
      'toggle-row--disabled': props.disabled,
      'toggle-row--without-divider': !props.divider,
      'toggle-row--separated-control': props.separateControl,
    }"
  >
    <div class="toggle-row-content">
      <div :id="labelId" class="toggle-row-label">
        {{ props.label }}
      </div>
      <div v-if="props.sublabel" class="toggle-row-sublabel">
        {{ props.sublabel }}
      </div>
    </div>

    <AdminToggle
      class="toggle-row-switch"
      :disabled="props.disabled"
      :model-value="model"
      @update:model-value="updateModel"
    />
  </div>
</template>

<script setup lang="ts">
import { useId } from "vue";

import AdminToggle from "../admin-toggle/AdminToggle.vue";
import { TOGGLE_ROW_DEFAULTS } from "./ToggleRow.constants";
import type { ToggleRowProps } from "./ToggleRow.types";

const props = withDefaults(defineProps<ToggleRowProps>(), TOGGLE_ROW_DEFAULTS);
const model = defineModel<boolean>({ required: true });
const labelId = `toggle-row-${useId()}-label`;

function updateModel(value: boolean | null) {
  if (!props.disabled && value !== null) {
    model.value = value;
  }
}
</script>

<style scoped lang="scss">
.toggle-row {
  position: relative;
  display: block;
  min-block-size: var(--expressa-size-status-min-height);
  padding: var(--expressa-space-row-block)
    var(--expressa-size-control-min-height) var(--expressa-space-row-block) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.toggle-row-content {
  min-width: 0;
  min-block-size: var(--expressa-size-status-min-height);
}

.toggle-row--without-divider {
  border-bottom-width: var(--expressa-border-width-none);
}

.toggle-row--separated-control {
  padding-inline-end: calc(
    var(--expressa-size-control-min-height) + var(--expressa-space-sm)
  );
}

.toggle-row-label {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-emphasis);
  overflow-wrap: anywhere;
}

.toggle-row-sublabel {
  margin-top: var(--expressa-space-2xs);
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption);
  overflow-wrap: anywhere;
}

.toggle-row--disabled .toggle-row-label {
  color: var(--expressa-color-text-muted);
}

.toggle-row-switch {
  position: absolute;
  block-size: var(--expressa-size-control-min-height);
  inset-inline-end: 0;
  inset-block: 0;
  margin-block: auto;
}
</style>
