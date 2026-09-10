<template>
  <v-dialog
    v-bind="$attrs"
    :aria-label="props.label"
    :activator="activator"
    :model-value="props.modelValue"
    @after-leave="focusReturnTarget"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="$slots.activator" #activator="slotProps">
      <slot name="activator" v-bind="slotProps" />
    </template>
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ComponentPublicInstance, Ref } from "vue";
import { UI_DIALOG_DEFAULTS } from "./UiDialog.constants";
import type { UiDialogEmits, UiDialogProps } from "./UiDialog.types";

type UiDialogActivatorTargetRef = {
  (
    target:
      InstanceType<typeof globalThis.Element> | ComponentPublicInstance | null,
  ): void;
  value:
    | InstanceType<typeof globalThis.HTMLElement>
    | ComponentPublicInstance
    | null
    | undefined;
  readonly el: InstanceType<typeof globalThis.HTMLElement> | undefined;
};

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiDialogProps>(), {
  ...UI_DIALOG_DEFAULTS,
  label: "Диалог",
});
const emit = defineEmits<UiDialogEmits>();
const activator = computed(
  () => getFocusElement(props.returnFocusTo) ?? undefined,
);
defineSlots<{
  activator?: (props: {
    isActive: boolean;
    props: Record<string, unknown>;
    targetRef: UiDialogActivatorTargetRef;
  }) => unknown;
  default?: (props: { isActive: Ref<boolean> }) => unknown;
}>();

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
