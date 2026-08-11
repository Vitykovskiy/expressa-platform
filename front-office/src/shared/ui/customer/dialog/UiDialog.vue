<template>
  <v-dialog
    v-bind="$attrs"
    :model-value="props.modelValue"
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

const props = withDefaults(defineProps<UiDialogProps>(), UI_DIALOG_DEFAULTS);
const emit = defineEmits<UiDialogEmits>();
defineSlots<{
  activator?: (props: {
    isActive: boolean;
    props: Record<string, unknown>;
    targetRef: UiDialogActivatorTargetRef;
  }) => unknown;
  default?: (props: { isActive: Ref<boolean> }) => unknown;
}>();
</script>
