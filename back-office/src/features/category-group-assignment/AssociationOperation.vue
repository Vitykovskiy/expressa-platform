<template>
  <div class="association-operation" tabindex="-1">
    <p role="status" aria-atomic="true">
      {{ operation.intent.label }}. {{ operation.message }}
    </p>
    <UiButton
      v-if="recoverable"
      variant="secondary"
      :disabled="disabled"
      :loading="operation.status === 'reconciling'"
      @activate="emit('reconcile')"
      >Проверить связи категории</UiButton
    >
    <UiButton
      v-if="operation.status === 'rejected'"
      variant="secondary"
      :disabled="disabled"
      :loading="refreshLoading"
      @activate="emit('refresh')"
      >Обновить каталог</UiButton
    >
    <UiButton
      v-if="operation.status === 'reconciled'"
      variant="secondary"
      :disabled="disabled"
      @activate="emit('leave')"
      >Вернуться к категориям</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  AssociationOperationProps,
  AssociationOperationEmits,
} from "./AssociationOperation.types";

const props = defineProps<AssociationOperationProps>();
const emit = defineEmits<AssociationOperationEmits>();
const recoverable = computed(() =>
  ["conflict", "absent", "unknown", "reconciling"].includes(
    props.operation.status,
  ),
);
</script>

<style scoped>
.association-operation {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
</style>
