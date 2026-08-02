<template>
  <VSelect
    :aria-describedby="attrs['aria-describedby']"
    :aria-label="attrs['aria-label']"
    :class="['ui-select', attrs.class]"
    :disabled="disabled"
    :error-messages="errorMessage"
    :items="items"
    :label="label"
    :model-value="modelValue"
    :data-testid="attrs['data-testid']"
    @blur="forwardBlur"
    @focus="forwardFocus"
    @keydown="forwardKeydown"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  />
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { VSelect } from "vuetify/components";

defineOptions({ inheritAttrs: false });
defineProps<{
  modelValue: string;
  label: string;
  items: ReadonlyArray<{ title: string; value: string }>;
  disabled?: boolean;
  errorMessage?: string;
}>();
const attrs = useAttrs();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const forwardBlur = attrs.onBlur as ((event: FocusEvent) => void) | undefined;
const forwardFocus = attrs.onFocus as ((event: FocusEvent) => void) | undefined;
const forwardKeydown = attrs.onKeydown as
  ((event: KeyboardEvent) => void) | undefined;
</script>

<style scoped>
.ui-select {
  min-height: var(--expressa-touch-target-min);
}
</style>
