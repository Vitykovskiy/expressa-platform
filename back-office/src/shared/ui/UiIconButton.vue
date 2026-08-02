<template>
  <VBtn
    :aria-describedby="attrs['aria-describedby']"
    :class="['ui-icon-button', attrs.class]"
    :aria-label="label"
    :disabled="disabled"
    icon
    :title="label"
    :data-testid="attrs['data-testid']"
    @blur="forwardBlur"
    @click="emit('click', $event)"
    @focus="forwardFocus"
    @keydown="forwardKeydown"
  >
    <slot />
  </VBtn>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { VBtn } from "vuetify/components";

defineOptions({ inheritAttrs: false });
defineProps<{ label: string; disabled?: boolean }>();
const attrs = useAttrs();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const forwardBlur = attrs.onBlur as ((event: FocusEvent) => void) | undefined;
const forwardFocus = attrs.onFocus as ((event: FocusEvent) => void) | undefined;
const forwardKeydown = attrs.onKeydown as
  ((event: KeyboardEvent) => void) | undefined;
</script>

<style scoped>
.ui-icon-button {
  min-width: var(--expressa-touch-target-min);
  min-height: var(--expressa-touch-target-min);
}
</style>
