<template>
  <div class="availability-row">
    <div class="row-label">
      <p class="row-name">{{ item.name }}</p>
      <p :id="descriptionId" class="row-description">{{ description }}</p>
    </div>
    <button
      class="row-switch"
      type="button"
      role="switch"
      :aria-checked="checked"
      :aria-label="item.controlLabel"
      :aria-describedby="descriptionId"
      :disabled="switchDisabled"
      :aria-busy="busy"
      @click="emit('toggle')"
    >
      <img
        class="switch-image"
        :src="checked ? checkedIcon : uncheckedIcon"
        alt=""
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AvailabilityToggleRowProps } from "./AvailabilityToggleRow.types";
import { AVAILABILITY_COMMAND_STATUS } from "./AvailabilityToggleRow.constants";
import checkedIcon from "./assets/checked.svg";
import uncheckedIcon from "./assets/unchecked.svg";

const props = defineProps<AvailabilityToggleRowProps>();
const emit = defineEmits<{ toggle: [] }>();

const checked = computed(() =>
  props.item.type === "product"
    ? props.item.persistedAvailable
    : props.item.effectiveAvailable,
);
const switchDisabled = computed(
  () => props.disabled || props.item.disabledReason !== null,
);
const descriptionId = computed(
  () => `availability-${props.item.type}-${props.item.id}-description`,
);
const busy = computed(
  () => props.commandPhase !== null && props.commandPhase !== "unknown",
);
const description = computed(() => {
  if (props.commandPhase !== null) {
    return AVAILABILITY_COMMAND_STATUS[props.commandPhase];
  }

  return props.item.disabledReason === "product-unavailable"
    ? `${props.item.description} · Весь напиток выключен`
    : props.item.description;
});
</script>

<style scoped>
.availability-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
}
.availability-row::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: var(--color-border);
  content: "";
}
.availability-row:last-child::after {
  display: none;
}
.row-label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row-name {
  margin: 0;
  color: var(--color-foreground);
  font-size: 15px;
  line-height: 22.5px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.row-description {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 12px;
  line-height: 16px;
  overflow-wrap: anywhere;
}
.row-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.switch-image {
  display: block;
  width: 44px;
  height: 24px;
}
.row-switch:disabled {
  cursor: default;
  opacity: 0.55;
}
.row-switch:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
  border-radius: var(--radius-control);
}
</style>
