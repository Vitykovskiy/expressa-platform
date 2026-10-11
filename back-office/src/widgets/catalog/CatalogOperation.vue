<template>
  <AssociationOperation
    v-if="operation.intent.kind === 'category-associations'"
    :operation="operation"
    :disabled="disabled"
    :refresh-loading="refreshLoading"
    @reconcile="emit('reconcile')"
    @refresh="emit('refresh')"
    @leave="emit('leave')"
  />
  <ModifierOperation
    v-else-if="operation.intent.kind.startsWith('modifier-')"
    :operation="operation"
    :disabled="disabled"
    :refresh-loading="refreshLoading"
    @reconcile="emit('reconcile')"
    @refresh="emit('refresh')"
    @leave="emit('leave')"
    @restart="emit('restart')"
  />
  <CategoryOperation
    v-else
    :operation="operation"
    :disabled="disabled"
    :refresh-loading="refreshLoading"
    @reconcile="emit('reconcile')"
    @refresh="emit('refresh')"
    @leave="emit('leave')"
    @restart="emit('restart')"
  />
</template>

<script setup lang="ts">
import CategoryOperation from "../../features/category-edit/CategoryOperation.vue";
import AssociationOperation from "../../features/category-group-assignment/AssociationOperation.vue";
import ModifierOperation from "../../features/modifier-group-edit/ModifierOperation.vue";
import type {
  CatalogOperationProps,
  CatalogOperationEmits,
} from "./CatalogOperation.types";

defineProps<CatalogOperationProps>();
const emit = defineEmits<CatalogOperationEmits>();
</script>
