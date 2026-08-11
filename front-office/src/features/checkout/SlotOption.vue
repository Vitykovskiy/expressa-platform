<template>
  <ui-btn
    type="button"
    class="slot-option"
    :class="{ 'slot-option--selected': props.selected }"
    :disabled="isDisabled"
    :aria-pressed="props.selected"
    @click="emit('select', props.timeSlot.id)"
  >
    <span class="slot-option__main">
      <span class="slot-option__clock">
        <Clock :size="14" aria-hidden="true" />
      </span>
      <span class="slot-option__time">
        <strong class="slot-option__range"
          >{{ props.timeSlot.timeFrom }}–{{ props.timeSlot.timeTo }}</strong
        >
        <small class="slot-option__date">{{ props.timeSlot.date }}</small>
      </span>
    </span>
    <span v-if="props.selected" class="slot-option__selected">
      <CheckCircle2 :size="18" aria-hidden="true" />
      <span>Выбрано</span>
    </span>
    <span v-else class="slot-option__capacity">
      <Users :size="12" aria-hidden="true" />
      {{
        props.timeSlot.available === 0
          ? "Занято"
          : `${props.timeSlot.available}/${props.timeSlot.capacity}`
      }}
    </span>
  </ui-btn>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CheckCircle2, Clock, Users } from "lucide-vue-next";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import type { SlotOptionEmits, SlotOptionProps } from "./SlotOption.types";

const props = withDefaults(defineProps<SlotOptionProps>(), { disabled: false });
const emit = defineEmits<SlotOptionEmits>();

const isDisabled = computed(
  () => props.disabled || props.timeSlot.available === 0,
);
</script>

<style scoped lang="scss">
.slot-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--customer-space-5);
  height: auto;
  min-height: var(--customer-size-control-xl);
  width: 100%;
  min-width: 0;
  padding: var(--customer-space-5) var(--customer-space-10);
  color: var(--customer-text);
  text-align: left;
  background: var(--customer-color-surface-subtle);
  border: 1px solid transparent;
  border-radius: var(--customer-radius);
  transition: var(--customer-transition-surface);
  white-space: normal;
}

.slot-option:active:not(:disabled) {
  transform: var(--customer-transform-press);
}

.slot-option:disabled {
  cursor: not-allowed;
  opacity: var(--customer-state-disabled-opacity);
}

.slot-option:focus-visible {
  outline: 2px solid var(--customer-color-focus);
  outline-offset: 2px;
}

.slot-option--selected {
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  box-shadow: var(--customer-shadow-card);
}

.slot-option__main {
  display: grid;
  grid-template-columns: var(--customer-size-control-sm) minmax(0, 1fr);
  align-items: center;
  gap: var(--customer-space-7);
  min-width: 0;
}

.slot-option__selected,
.slot-option__capacity {
  display: inline-flex;
  justify-self: end;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
}

.slot-option__clock {
  display: grid;
  width: var(--customer-size-control-sm);
  height: var(--customer-size-control-sm);
  place-items: center;
  background: var(--customer-color-surface-subtle);
  border-radius: var(--customer-radius-round);
}

.slot-option--selected .slot-option__clock {
  color: var(--customer-text);
  background: var(--customer-background);
}

.slot-option__time,
.slot-option__range,
.slot-option__date {
  display: block;
}

.slot-option__time {
  min-width: 0;
}

.slot-option__range {
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
  white-space: nowrap;
}

.slot-option__date {
  margin-top: var(--customer-space-2);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
  overflow-wrap: anywhere;
}

.slot-option--selected .slot-option__date {
  color: var(--customer-color-text-muted-on-surface);
}

.slot-option__selected,
.slot-option__capacity {
  gap: var(--customer-space-4);
}

.slot-option__capacity {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
}

.slot-option__selected {
  color: var(--customer-background);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-extrabold);
}
</style>
