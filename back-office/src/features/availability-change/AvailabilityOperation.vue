<template>
  <div class="availability-operation" tabindex="-1">
    <p role="status" aria-atomic="true">
      {{ operation.label }}. {{ operation.message }}
    </p>
    <p v-if="unconfirmed" class="availability-operation__context">
      Последнее подтверждённое значение: {{ operation.previous ? "Да" : "Нет" }}
    </p>
    <UiButton
      v-if="recoverable"
      variant="secondary"
      :loading="reconciling"
      :disabled="disabled"
      @activate="emit('reconcile')"
      >{{ recoveryLabel }}</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  AvailabilityOperationEmits,
  AvailabilityOperationProps,
} from "./AvailabilityOperation.types";

const props = defineProps<AvailabilityOperationProps>();
const emit = defineEmits<AvailabilityOperationEmits>();
const recoverable = computed(
  () =>
    !["sending", "completed", "reconciled"].includes(props.operation.status),
);
const reconciling = computed(() => props.operation.status === "reconciling");
const unconfirmed = computed(
  () => props.operation.status === "unknown" || reconciling.value,
);
const recoveryLabel = computed(() =>
  props.operation.status === "failed" || props.operation.status === "absent"
    ? "Обновить данные"
    : props.operation.kind === "intake"
      ? "Проверить приём"
      : "Проверить доступность",
);
</script>

<style scoped>
.availability-operation {
  display: grid;
  justify-items: start;
  gap: var(--space-sm);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.availability-operation__context {
  color: var(--color-foreground-muted);
  font-size: var(--font-data);
}
</style>
