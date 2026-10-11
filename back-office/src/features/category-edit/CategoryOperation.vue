<template>
  <div class="category-operation" tabindex="-1">
    <p role="status" aria-atomic="true">
      {{ operationLabel }}. {{ operation.message }}
    </p>
    <UiButton
      v-if="recoverable"
      variant="secondary"
      :loading="reconciling"
      :disabled="disabled"
      @activate="emit('reconcile')"
      >Проверить каталог</UiButton
    >
    <UiButton
      v-if="rejected"
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
      >{{ returnLabel }}</UiButton
    >
    <UiButton
      v-if="restartable"
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
  CategoryOperationProps,
  CategoryOperationEmits,
} from "./CategoryOperation.types";

const props = defineProps<CategoryOperationProps>();
const emit = defineEmits<CategoryOperationEmits>();
const operationLabel = computed(() =>
  props.operation.intent.kind === "reorder" ||
  props.operation.intent.kind === "product-reorder"
    ? props.operation.intent.label
    : `${props.operation.intent.kind.startsWith("product-") ? "Товар" : "Категория"} ${props.operation.intent.label}`,
);
const returnLabel = computed(() =>
  props.operation.intent.kind.startsWith("product-")
    ? "Вернуться к товарам"
    : "Вернуться к категориям",
);
const recoverable = computed(() =>
  ["conflict", "absent", "unknown", "reconciling"].includes(
    props.operation.status,
  ),
);
const reconciling = computed(() => props.operation.status === "reconciling");
const rejected = computed(() => props.operation.status === "rejected");
const reconciled = computed(
  () =>
    props.operation.status === "reconciled" ||
    props.operation.status === "reconciled_ambiguous_create",
);
const restartable = computed(
  () =>
    props.operation.status === "reconciled" &&
    (props.operation.intent.kind === "reorder" ||
      props.operation.intent.kind === "product-reorder"),
);
</script>

<style scoped>
.category-operation {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
</style>
