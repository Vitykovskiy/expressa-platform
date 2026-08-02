<template>
  <VTabs
    :aria-describedby="attrs['aria-describedby']"
    :class="['ui-tabs', attrs.class]"
    :model-value="modelValue"
    :aria-label="label"
    :data-testid="attrs['data-testid']"
    @blur="forwardBlur"
    @focus="forwardFocus"
    @keydown="forwardKeydown"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <VTab
      v-for="tab in tabs"
      :key="tab.value"
      :disabled="tab.disabled"
      :value="tab.value"
      >{{ tab.label }}</VTab
    >
  </VTabs>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { VTab, VTabs } from "vuetify/components";

defineOptions({ inheritAttrs: false });
defineProps<{
  modelValue: string;
  label: string;
  tabs: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
}>();
const attrs = useAttrs();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const forwardBlur = attrs.onBlur as ((event: FocusEvent) => void) | undefined;
const forwardFocus = attrs.onFocus as ((event: FocusEvent) => void) | undefined;
const forwardKeydown = attrs.onKeydown as
  ((event: KeyboardEvent) => void) | undefined;
</script>

<style scoped>
.ui-tabs {
  min-height: var(--expressa-touch-target-min);
}
</style>
