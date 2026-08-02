<template>
  <VBtn
    :aria-describedby="attrs['aria-describedby']"
    :aria-label="attrs['aria-label']"
    :class="['ui-button', attrs.class]"
    :color="color"
    :disabled="disabled || loading"
    :loading="loading"
    :type="type"
    :data-testid="attrs['data-testid']"
    @blur="forwardBlur"
    @click="emit('click', $event)"
    @focus="forwardFocus"
    @keydown="forwardKeydown"
  >
    <template v-if="loading" #loader>
      <span role="status">{{ loadingLabel }}</span>
    </template>
    <slot />
  </VBtn>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { VBtn } from "vuetify/components";

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    color?: "primary" | "error";
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    color: "primary",
    disabled: false,
    loading: false,
    loadingLabel: "Загрузка",
    type: "button",
  },
);

const attrs = useAttrs();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const forwardBlur = attrs.onBlur as ((event: FocusEvent) => void) | undefined;
const forwardFocus = attrs.onFocus as ((event: FocusEvent) => void) | undefined;
const forwardKeydown = attrs.onKeydown as
  ((event: KeyboardEvent) => void) | undefined;
</script>

<style scoped>
.ui-button {
  min-height: var(--expressa-touch-target-min);
}
</style>
