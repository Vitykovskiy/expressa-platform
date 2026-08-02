<template>
  <VDialog
    :model-value="modelValue"
    :aria-label="title"
    @after-enter="focusCancel"
    @after-leave="restoreFocus"
    @update:model-value="close"
  >
    <section
      class="confirm-dialog"
      role="document"
      :aria-labelledby="titleId"
      @keydown.esc.stop.prevent="dismiss"
    >
      <h2 :id="titleId">{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="confirm-dialog-actions">
        <UiButton color="error" @click="confirm">{{ confirmLabel }}</UiButton>
        <UiButton ref="cancelButton" @click="close(false)">{{
          cancelLabel
        }}</UiButton>
      </div>
    </section>
  </VDialog>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { VDialog } from "vuetify/components";
import UiButton from "./UiButton.vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }>(),
  { confirmLabel: "Подтвердить", cancelLabel: "Отмена" },
);
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();
const cancelButton = ref<InstanceType<typeof UiButton> | null>(null);
let opener: HTMLElement | null = null;
const titleId = "confirm-dialog-title";

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && document.activeElement instanceof HTMLElement)
      opener = document.activeElement;
  },
);

function handleEscape(event: KeyboardEvent): void {
  if (props.modelValue && event.key === "Escape") {
    event.preventDefault();
    dismiss();
  }
}

onMounted(() => window.addEventListener("keydown", handleEscape, true));
onUnmounted(() => window.removeEventListener("keydown", handleEscape, true));

function focusCancel(): void {
  void nextTick(() => cancelButton.value?.$el.focus());
}
function restoreFocus(): void {
  opener?.focus();
  opener = null;
}
function close(value: boolean): void {
  if (!value) emit("cancel");
  emit("update:modelValue", value);
}
function dismiss(): void {
  close(false);
}
function confirm(): void {
  emit("confirm");
  emit("update:modelValue", false);
}
</script>

<style scoped>
.confirm-dialog {
  max-width: 27.5rem;
  padding: var(--expressa-space-6);
  background: rgb(var(--v-theme-surface));
}
.confirm-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--expressa-space-2);
  margin-top: var(--expressa-space-6);
}
</style>
