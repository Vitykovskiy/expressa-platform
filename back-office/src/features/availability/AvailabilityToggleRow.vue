<template>
  <div class="availability-row">
    <div class="row-label">
      <p class="row-name">{{ item.name }}</p>
      <p class="row-description">{{ status || item.description }}</p>
    </div>
    <button
      class="row-switch"
      type="button"
      role="switch"
      :aria-checked="item.available"
      :aria-label="item.name"
      :disabled="disabled"
      :aria-busy="status.length > 0"
      @click="emit('toggle')"
    >
      <img :src="item.available ? checkedIcon : uncheckedIcon" alt="" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AvailabilityToggleRowProps } from "./AvailabilityToggleRow.types";
import checkedIcon from "./assets/checked.svg";
import uncheckedIcon from "./assets/unchecked.svg";

defineProps<AvailabilityToggleRowProps>();
const emit = defineEmits<{ toggle: [] }>();
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
  width: 44px;
  height: 24px;
  flex: 0 0 44px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.row-switch:disabled {
  cursor: wait;
}
.row-switch:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
  border-radius: var(--radius-control);
}
</style>
