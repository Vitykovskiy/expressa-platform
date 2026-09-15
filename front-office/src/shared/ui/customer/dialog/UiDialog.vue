<template>
  <v-dialog
    v-bind="$attrs"
    :aria-label="props.label"
    :model-value="props.modelValue"
    :persistent="dismissalLocked"
    @after-leave="focusReturnTarget"
    @keydown="handleKeydown"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { onUnmounted, shallowRef, watch } from "vue";
import type { Ref } from "vue";
import {
  UI_DIALOG_DEFAULTS,
  UI_DIALOG_OPEN_GUARD_MS,
} from "./UiDialog.constants";
import type { UiDialogEmits, UiDialogProps } from "./UiDialog.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiDialogProps>(), {
  ...UI_DIALOG_DEFAULTS,
  label: "Диалог",
});
const emit = defineEmits<UiDialogEmits>();
const dismissalLocked = shallowRef(false);
let openGuardTimer: ReturnType<typeof setTimeout> | null = null;
defineSlots<{
  default?: (props: { isActive: Ref<boolean> }) => unknown;
}>();

watch(
  () => props.modelValue,
  (open, wasOpen) => {
    if (open && !wasOpen) startOpenGuard();
    if (!open) {
      stopOpenGuard();
      if (wasOpen) focusReturnTarget();
    }
  },
);

onUnmounted(stopOpenGuard);

function handleKeydown(event: KeyboardEvent): void {
  if (dismissalLocked.value && event.key === "Escape") {
    event.preventDefault();
    emit("update:modelValue", false);
  }
}

function startOpenGuard(): void {
  stopOpenGuard();
  dismissalLocked.value = true;
  openGuardTimer = setTimeout(() => {
    dismissalLocked.value = false;
    openGuardTimer = null;
  }, UI_DIALOG_OPEN_GUARD_MS);
}

function stopOpenGuard(): void {
  if (openGuardTimer !== null) clearTimeout(openGuardTimer);
  openGuardTimer = null;
  dismissalLocked.value = false;
}

function focusReturnTarget(): void {
  getFocusElement(props.returnFocusTo)?.focus();
}

function getFocusElement(
  target: UiDialogProps["returnFocusTo"],
): HTMLElement | null {
  return target instanceof HTMLElement
    ? target
    : target?.$el instanceof HTMLElement
      ? target.$el
      : null;
}
</script>
