<template>
  <div
    class="availability-change"
    @keydown.capture="guardRepeat"
    @click.capture="guardMultipleClick"
  >
    <UiSwitch
      :model-value="value"
      :label="label"
      :pending="sending"
      :disabled="disabled"
      @update:model-value="change"
    />
    <AvailabilityOperation
      v-if="operation"
      :operation="operation"
      :disabled="recoveryDisabled"
      @reconcile="emit('reconcile')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiSwitch from "../../shared/ui/UiSwitch/UiSwitch.vue";
import AvailabilityOperation from "./AvailabilityOperation.vue";
import type {
  AvailabilityChangeEmits,
  AvailabilityChangeProps,
} from "./AvailabilityChange.types";

const props = defineProps<AvailabilityChangeProps>();
const emit = defineEmits<AvailabilityChangeEmits>();
const sending = computed(() => props.operation?.status === "sending");

function change(requested: boolean) {
  emit("change", { kind: props.kind, id: props.id, requested });
}

function guardRepeat(event: KeyboardEvent) {
  if (event.repeat && (event.key === "Enter" || event.key === " "))
    event.preventDefault();
}

function guardMultipleClick(event: MouseEvent) {
  if (event.detail > 1) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
</script>

<style scoped>
.availability-change {
  display: grid;
  gap: var(--space-sm);
  min-inline-size: 0;
}
</style>
