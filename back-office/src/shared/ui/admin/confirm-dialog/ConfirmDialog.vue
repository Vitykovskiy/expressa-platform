<template>
  <AdminDialog
    :cancel-label="props.cancelLabel"
    :pending="props.pending"
    :model-value="open"
    max-width="var(--expressa-size-confirm-dialog-max-width)"
    :submit-disabled="props.pending"
    submit-form="confirm-dialog-form"
    :submit-label="props.confirmLabel"
    :submit-variant="props.confirmVariant"
    :title="props.title"
    @update:model-value="handleDialogUpdate"
  >
    <form
      id="confirm-dialog-form"
      class="confirm-dialog"
      @submit.prevent="handleConfirm"
    >
      <p :id="descriptionId" class="confirm-dialog-description">
        {{ props.description }}
      </p>

      <AdminFieldWrapper
        v-if="props.requireInput"
        :id="reasonInputId"
        v-slot="field"
        :error="reasonError"
        label="Причина"
        required
      >
        <AdminTextField
          :id="field.controlId"
          :disabled="props.pending"
          :model-value="reason"
          :required="field.required"
          @update:model-value="handleReasonUpdate"
        />
      </AdminFieldWrapper>
    </form>
  </AdminDialog>
</template>

<script setup lang="ts">
import { nextTick, shallowRef, useId, watch } from "vue";

import { CONFIRM_DIALOG_DEFAULTS } from "./ConfirmDialog.constants";
import type {
  ConfirmDialogEmits,
  ConfirmDialogProps,
} from "./ConfirmDialog.types";
import AdminDialog from "../admin-dialog/AdminDialog.vue";
import AdminFieldWrapper from "../field-wrapper/AdminFieldWrapper.vue";
import AdminTextField from "../admin-text-field/AdminTextField.vue";

const props = withDefaults(
  defineProps<ConfirmDialogProps>(),
  CONFIRM_DIALOG_DEFAULTS,
);

const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<ConfirmDialogEmits>();

const reason = shallowRef("");
const reasonError = shallowRef("");
const descriptionId = `confirm-dialog-description-${useId()}`;
const reasonInputId = `confirm-dialog-reason-${useId()}`;

function resetDraft() {
  reason.value = "";
  reasonError.value = "";
}

function closeAsCancelled() {
  if (props.pending) return;

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

async function handleConfirm() {
  if (props.pending) return;
  if (props.requireInput && !reason.value.trim()) {
    reasonError.value = "Укажите причину";
    return;
  }

  emit("confirm", props.requireInput ? reason.value : undefined);

  await nextTick();

  if (!props.pending) {
    resetDraft();
    open.value = false;
  }
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    return;
  }

  if (!isOpen && wasOpen) {
    resetDraft();
  }
});
</script>

<style scoped lang="scss">
.confirm-dialog-description {
  margin: 0;
  padding: 0 0 var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
  white-space: normal;
}
</style>
