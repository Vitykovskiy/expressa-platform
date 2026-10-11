<template>
  <div class="modifier-operation" tabindex="-1">
    <p role="status" aria-atomic="true">
      {{ operation.intent.label }}. {{ operation.message }}
    </p>
    <UiButton
      v-if="recoverable"
      variant="secondary"
      :loading="operation.status === 'reconciling'"
      :disabled="disabled"
      @activate="emit('reconcile')"
      >Проверить каталог</UiButton
    >
    <UiButton
      v-if="operation.status === 'rejected'"
      variant="secondary"
      :loading="refreshLoading"
      :disabled="disabled"
      @activate="emit('refresh')"
      >Обновить каталог</UiButton
    >
    <UiButton
      v-if="reconciled"
      variant="secondary"
      :disabled="disabled"
      @activate="emit('leave')"
      >Вернуться к группам</UiButton
    >
    <UiButton
      v-if="
        operation.status === 'reconciled' &&
        operation.intent.kind === 'modifier-reorder'
      "
      variant="quiet"
      :disabled="disabled"
      @activate="emit('restart')"
      >Начать порядок заново</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  ModifierOperationProps,
  ModifierOperationEmits,
} from "./ModifierOperation.types";

const props = defineProps<ModifierOperationProps>();
const emit = defineEmits<ModifierOperationEmits>();
const recoverable = computed(() =>
  ["conflict", "absent", "unknown", "reconciling"].includes(
    props.operation.status,
  ),
);
const reconciled = computed(() =>
  ["reconciled", "reconciled_ambiguous_create"].includes(
    props.operation.status,
  ),
);
</script>

<style scoped>
.modifier-operation {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
</style>
