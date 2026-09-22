<template>
  <v-select
    ref="select"
    v-bind="attrs"
    class="admin-select"
    density="comfortable"
    hide-details
    :items="props.items"
    :model-value="props.modelValue"
    :placeholder="props.placeholder"
    variant="outlined"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
import { useAttrs, useTemplateRef } from "vue";
import { ADMIN_SELECT_DEFAULTS } from "./AdminSelect.constants";
import type { AdminSelectEmits, AdminSelectProps } from "./AdminSelect.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminSelectProps>(),
  ADMIN_SELECT_DEFAULTS,
);
const emit = defineEmits<AdminSelectEmits>();
const attrs = useAttrs();
const select = useTemplateRef<{ focus: () => void }>("select");

function focus(): void {
  select.value?.focus();
}

function handleUpdate(value: string | number | null): void {
  emit("update:modelValue", value === null ? "" : String(value));
}

defineExpose({ focus });
</script>

<style scoped lang="scss">
.admin-select {
  inline-size: 100%;
}
</style>
