<template>
  <div class="availability-filters" aria-label="Группа позиций">
    <button
      v-for="pill in pills"
      :key="pill.key"
      type="button"
      :class="pill.className"
      :aria-pressed="pill.selected"
      @click="emit('select', pill.value)"
    >
      {{ pill.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AvailabilityFiltersProps } from "./AvailabilityFilters.types";

const props = defineProps<AvailabilityFiltersProps>();
const emit = defineEmits<{ select: [key: string | null] }>();

const pills = computed(() => {
  const options = [
    { key: "all", value: null, name: "Все" },
    ...props.groups.map((group) => ({
      key: group.key,
      value: group.key,
      name: group.name,
    })),
  ];

  return options.map((option) => {
    const selected = props.selected === option.value;

    return {
      ...option,
      selected,
      className: selected ? "filter-pill selected" : "filter-pill",
    };
  });
});
</script>

<style scoped>
.availability-filters {
  display: flex;
  align-items: flex-start;
  flex: 0 0 auto;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0;
  width: 100%;
  background: var(--color-surface);
}
.filter-pill {
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  padding: 8px 16px;
  background: var(--color-background);
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.filter-pill.selected {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.filter-pill:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
@media (max-width: 767px) {
  .availability-filters {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
