<template>
  <VDialog
    :model-value="open"
    :persistent="!dismissible"
    :max-width="'var(--dialog-width)'"
    :aria-labelledby="titleId"
    :retain-focus="true"
    :transition="false"
    :no-click-animation="true"
    @update:model-value="update"
  >
    <section
      ref="dialog"
      class="ui-dialog foundation-root"
      tabindex="-1"
      :data-theme="theme.current.value.dark ? 'dark' : 'light'"
    >
      <header class="ui-dialog__header">
        <h2 :id="titleId" class="foundation-section-title">{{ title }}</h2>
      </header>
      <div class="ui-dialog__body"><slot /></div>
      <footer class="ui-dialog__actions ui-actions">
        <slot name="actions" />
      </footer>
    </section>
  </VDialog>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, useId, useTemplateRef, watch } from "vue";
import { VDialog } from "vuetify/components";
import { useTheme } from "vuetify";
import { dialogDefaults } from "./UiDialog.constants";
import type {
  UiDialogEmits,
  UiDialogProps,
  UiDialogSlots,
} from "./UiDialog.types";

const props = withDefaults(defineProps<UiDialogProps>(), dialogDefaults);
const emit = defineEmits<UiDialogEmits>();
const titleId = useId();
const theme = useTheme();
const dialog = useTemplateRef<HTMLElement>("dialog");
let trigger: HTMLElement | null = null;
let lifetime = 0;
let disposed = false;

defineSlots<UiDialogSlots>();

watch(
  () => props.open,
  async (open) => {
    const version = ++lifetime;

    if (open) {
      trigger =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      await nextTick();
      if (disposed || version !== lifetime || !props.open) return;

      const surface = dialog.value;
      const focused = document.activeElement;

      if (
        focused !== trigger &&
        focused !== document.body &&
        focused instanceof HTMLElement &&
        !focused.contains(surface) &&
        !surface?.contains(focused)
      )
        return;

      if (surface && surface.scrollHeight > surface.clientHeight) {
        surface.focus();
      } else {
        surface
          ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
          ?.focus();
      }
    } else {
      await nextTick();
      if (disposed || version !== lifetime || props.open) return;

      if (props.restoreFocus && trigger?.isConnected) trigger.focus();
      if (trigger !== null) emit("closed");
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  disposed = true;
  lifetime += 1;
});

function update(value: boolean) {
  if (!value && !props.dismissible) {
    return;
  }

  emit("update:open", value);
}
</script>

<style scoped>
.ui-dialog {
  display: flex;
  flex-direction: column;
  max-block-size: calc(100dvh - var(--space-xxl));
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  color: var(--color-foreground);
  box-shadow: var(--shadow-overlay);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.ui-dialog__header,
.ui-dialog__actions {
  padding: var(--space-xl);
  flex: none;
}
.ui-dialog:focus-visible {
  outline: var(--focus-width) solid var(--color-focus);
  outline-offset: var(--focus-offset);
}
.ui-dialog__header {
  overflow-wrap: anywhere;
}
.ui-dialog__body {
  padding: 0 var(--space-xl);
  flex: none;
  overflow-wrap: anywhere;
}
</style>
