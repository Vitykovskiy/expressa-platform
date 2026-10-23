<template>
  <div class="availability-groups">
    <section
      v-for="group in groups"
      :key="group.key"
      class="availability-group"
      :aria-label="group.name"
    >
      <h2 class="group-heading">{{ group.name }}</h2>
      <div class="group-rows">
        <div
          v-for="item in group.items"
          :key="`${item.type}:${item.id}`"
          class="availability-entry"
        >
          <AvailabilityToggleRow
            :item="item"
            :disabled="disabled"
            :command-phase="commandPhase(item)"
            @toggle="emit('toggle', item)"
          />
          <div v-if="item.type === 'product'" class="product-sizes">
            <AvailabilityToggleRow
              v-for="choice in item.children"
              :key="choice.id"
              :item="choice"
              :disabled="disabled"
              :command-phase="commandPhase(choice)"
              @toggle="emit('toggle', choice)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AvailabilityItem } from "../../entities/availability/availability.types";
import AvailabilityToggleRow from "./AvailabilityToggleRow.vue";
import type { AvailabilityGroupsProps } from "./AvailabilityGroups.types";

const props = defineProps<AvailabilityGroupsProps>();
const emit = defineEmits<{ toggle: [item: AvailabilityItem] }>();

function commandPhase(item: AvailabilityItem) {
  if (
    props.command?.item.id !== item.id ||
    props.command.item.type !== item.type
  ) {
    return null;
  }

  return props.command.phase;
}
</script>

<style scoped>
.availability-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.availability-group {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  overflow: hidden;
}
.group-heading {
  margin: 0;
  padding: 12px 16px;
  color: var(--color-foreground-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-border);
  overflow-wrap: anywhere;
}
.group-rows {
  padding: 0 16px;
}
.availability-entry + .availability-entry {
  border-top: 1px solid var(--color-border);
}
.product-sizes {
  padding-left: 20px;
}
</style>
