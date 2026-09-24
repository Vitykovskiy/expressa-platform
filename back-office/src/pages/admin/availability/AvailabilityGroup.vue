<template>
  <section class="availability-group">
    <header class="availability-group__header">
      <h2 class="availability-group__title">
        {{ props.category }}
      </h2>
    </header>

    <div class="availability-group__items">
      <ToggleRow
        v-for="item in props.items"
        :key="item.id"
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
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-semibold);
  letter-spacing: var(--expressa-letter-spacing-section-title);
  line-height: var(--expressa-line-height-heading);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.availability-group__items {
  padding: 0 var(--expressa-space-md);
}

.availability-group__items :deep(.toggle-row:last-child) {
  border-bottom: var(--expressa-border-width-none);
}
</style>
