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
        :label="item.name"
        :sublabel="sublabel(item)"
        :model-value="item.available"
        @update:model-value="updateAvailability(item.id, $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MenuItem } from "../../shared/ui/Admin.types";
import ToggleRow from "../../shared/ui/toggle-row/ToggleRow.vue";
import type {
  AvailabilityGroupEmits,
  AvailabilityGroupProps,
} from "./AvailabilityGroup.types";

const props = defineProps<AvailabilityGroupProps>();
const emit = defineEmits<AvailabilityGroupEmits>();

function sublabel(item: MenuItem) {
  return item.price ? `${item.price} ₽` : "Несколько размеров";
}

function updateAvailability(id: string, checked: boolean) {
  emit("availability-change", { id, checked });
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
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  letter-spacing: 0.025em;
  line-height: var(--expressa-line-height-body);
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.availability-group__items {
  padding: 0 var(--expressa-space-md);
}

.availability-group__items > :last-child {
  border-bottom: var(--expressa-border-width-none);
}
</style>
