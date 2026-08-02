<template>
  <VSwitch
    :aria-describedby="attrs['aria-describedby']"
    :class="['ui-toggle', attrs.class]"
    :disabled="disabled"
    :label="label"
    :model-value="modelValue"
    :data-testid="attrs['data-testid']"
    @blur="forwardBlur"
    @focus="forwardFocus"
    @keydown="forwardKeydown"
    @update:model-value="emit('update:modelValue', Boolean($event))"
  />
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { VSwitch } from "vuetify/components";

defineOptions({ inheritAttrs: false });
defineProps<{ modelValue: boolean; label: string; disabled?: boolean }>();
const attrs = useAttrs();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const forwardBlur = attrs.onBlur as ((event: FocusEvent) => void) | undefined;
const forwardFocus = attrs.onFocus as ((event: FocusEvent) => void) | undefined;
const forwardKeydown = attrs.onKeydown as
  ((event: KeyboardEvent) => void) | undefined;
</script>

<style scoped>
.ui-toggle {
  min-height: var(--expressa-touch-target-min);
}
</style>
