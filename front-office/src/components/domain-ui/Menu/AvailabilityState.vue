<template>
  <p class="availability" :class="availabilityClass" role="status">
    {{ availabilityLabel }}
  </p>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "FoAvailabilityState" });

const props = defineProps<{ available: boolean }>();

const availabilityLabel = computed(() =>
  props.available ? "Доступно" : "Сейчас недоступно",
);
const availabilityClass = computed(() => ({
  "availability--unavailable": !props.available,
}));
</script>

<style scoped>
.availability {
  margin: 0;
  color: var(--fo-success);
  font: 600 0.875rem/1.2 var(--fo-font);
}

.availability--unavailable {
  color: var(--fo-danger);
}
</style>
