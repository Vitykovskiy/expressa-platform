<template>
  <section class="availability-group">
    <header class="availability-group__header">
      <h2 class="availability-group__title">
        {{ props.category }}
      </h2>
    </header>

    <div class="availability-group__items">
      <ToggleRow
        v-for="(item, index) in props.items"
        :key="`${item.type}:${item.id}`"
        :divider="index < props.items.length - 1"
        separate-control
        :label="item.label"
        :sublabel="item.sublabel"
        :disabled="props.disabled"
        :model-value="item.isAvailable"
        @update:model-value="updateAvailability(item, $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AvailabilityItem } from "../../../shared/api/availability.api.types";
import ToggleRow from "../../../shared/ui/admin/toggle-row/ToggleRow.vue";
import type {
  AvailabilityGroupEmits,
  AvailabilityGroupProps,
} from "./AvailabilityGroup.types";

const props = defineProps<AvailabilityGroupProps>();
const emit = defineEmits<AvailabilityGroupEmits>();

function updateAvailability(item: AvailabilityItem, isAvailable: boolean) {
  emit("availability-change", item, isAvailable);
}
</script>

<style scoped lang="scss">
.availability-group {
  overflow: hidden;
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}

.availability-group__header {
  padding: var(--expressa-space-control-inline) var(--expressa-space-md);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.availability-group__title {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body-strong);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-heading);
  overflow-wrap: anywhere;
}

.availability-group__items {
  padding: 0 var(--expressa-space-md);
}
</style>
