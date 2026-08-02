<template>
  <div class="toggle-row" :class="{ 'toggle-row--disabled': props.disabled }">
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
      :aria-labelledby="labelId"
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
  display: flex;
  min-height: var(--expressa-size-row-min);
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-row-block) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.toggle-row-content {
  min-width: 0;
  flex: 1;
}

.toggle-row-label {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  overflow-wrap: anywhere;
}

.toggle-row-sublabel {
  margin-top: var(--expressa-space-2xs);
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  overflow-wrap: anywhere;
}

.toggle-row--disabled .toggle-row-label {
  color: var(--expressa-color-text-muted);
}

.toggle-row-switch {
  flex: 0 0 auto;
}
</style>
