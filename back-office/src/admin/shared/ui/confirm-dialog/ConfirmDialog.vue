<template>
  <AdminDialog
    :aria-describedby="descriptionId"
    :aria-labelledby="titleId"
    :model-value="open"
    max-width="448"
    @update:model-value="handleDialogUpdate"
  >
    <v-card class="confirm-dialog">
      <v-card-title :id="titleId" class="confirm-dialog-title">
        {{ props.title }}
      </v-card-title>

      <v-card-text :id="descriptionId" class="confirm-dialog-description">
        {{ props.description }}
      </v-card-text>

      <v-card-text v-if="props.requireInput" class="confirm-dialog-reason">
        <v-text-field
          :id="reasonInputId"
          class="confirm-dialog-reason-input"
          :aria-describedby="reasonDescribedBy"
          :error="Boolean(reasonError)"
          :model-value="reason"
          :placeholder="props.inputPlaceholder"
          density="comfortable"
          hide-details
          variant="outlined"
          @keydown.enter="handleConfirm"
          @update:model-value="handleReasonUpdate"
        />
        <p
          v-if="reasonError"
          :id="reasonErrorId"
          class="confirm-dialog-error"
          role="alert"
        >
          {{ reasonError }}
        </p>
      </v-card-text>

      <v-card-actions class="confirm-dialog-actions">
        <AdminButton
          class="confirm-dialog-action"
          :variant="props.confirmVariant"
          @click="handleConfirm"
        >
          {{ props.confirmLabel }}
        </AdminButton>
        <AdminButton
          class="confirm-dialog-action"
          variant="ghost"
          @click="closeAsCancelled"
        >
          Отмена
        </AdminButton>
      </v-card-actions>
    </v-card>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, shallowRef, useId, watch } from "vue";

import { CONFIRM_DIALOG_DEFAULTS } from "./ConfirmDialog.constants";
import type {
  ConfirmDialogEmits,
  ConfirmDialogProps,
  FocusableElement,
} from "./ConfirmDialog.types";
import AdminButton from "../admin-button/AdminButton.vue";
import AdminDialog from "../admin-dialog/AdminDialog.vue";

const props = withDefaults(
  defineProps<ConfirmDialogProps>(),
  CONFIRM_DIALOG_DEFAULTS,
);

const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<ConfirmDialogEmits>();

const reason = shallowRef("");
const reasonError = shallowRef("");
const returnFocusTarget = shallowRef<FocusableElement | null>(null);
const titleId = `confirm-dialog-title-${useId()}`;
const descriptionId = `confirm-dialog-description-${useId()}`;
const reasonInputId = `confirm-dialog-reason-${useId()}`;
const reasonErrorId = `confirm-dialog-reason-error-${useId()}`;
const reasonDescribedBy = computed(() =>
  reasonError.value ? reasonErrorId : undefined,
);

function resetDraft() {
  reason.value = "";
  reasonError.value = "";
}

function closeAsCancelled() {
  resetDraft();
  open.value = false;
  emit("cancel");
}

function handleDialogUpdate(isOpen: boolean) {
  if (isOpen) {
    open.value = true;
    return;
  }

  closeAsCancelled();
}

function handleReasonUpdate(value: string) {
  reason.value = value;

  if (reasonError.value) {
    reasonError.value = "";
  }
}

function handleConfirm() {
  if (props.requireInput && !reason.value.trim()) {
    reasonError.value = "Укажите причину";
    return;
  }

  emit("confirm", props.requireInput ? reason.value : undefined);
  resetDraft();
  open.value = false;
}

function isFocusableElement(value: unknown): value is FocusableElement {
  return (
    typeof value === "object" &&
    value !== null &&
    "focus" in value &&
    typeof value.focus === "function"
  );
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    const activeElement = globalThis.document?.activeElement;
    returnFocusTarget.value = isFocusableElement(activeElement)
      ? activeElement
      : null;
    return;
  }

  if (!isOpen && wasOpen) {
    resetDraft();

    const focusTarget = returnFocusTarget.value;
    returnFocusTarget.value = null;

    if (focusTarget) {
      void nextTick(() => focusTarget.focus());
    }
  }
});
</script>

<style scoped lang="scss">
.confirm-dialog {
  border-radius: var(--expressa-radius-lg);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}

.confirm-dialog-title {
  padding: var(--expressa-space-lg) var(--expressa-space-lg)
    var(--expressa-space-sm);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: 28px;
  white-space: normal;
}

.confirm-dialog-description {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: 20px;
  white-space: normal;
}

.confirm-dialog-reason {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-md);
}

.confirm-dialog-reason:focus-within {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}

.confirm-dialog-error {
  margin: var(--expressa-space-xs) 0 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption);
}

.confirm-dialog-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--expressa-space-sm);
  padding: 0 var(--expressa-space-lg);
}

.confirm-dialog-action {
  width: 100%;
  height: 40px;
  min-height: 40px;
}
</style>
