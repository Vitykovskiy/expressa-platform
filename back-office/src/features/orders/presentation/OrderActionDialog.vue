<template>
  <OperationsModal
    v-if="copy"
    :open="props.mode !== null"
    :title="copy.title"
    :description="copy.description"
    :width="448"
    layout="confirmation"
    bottom-sheet
    :persistent="props.pending"
    @close="close"
  >
    <template v-if="props.mode === 'reject' || props.errorMessage" #default>
      <OperationsInput
        v-if="props.mode === 'reject'"
        label="Причина отклонения"
        hide-label
        type="reason"
        :model-value="props.reason"
        placeholder="Причина отклонения"
        :disabled="props.pending"
        @update:model-value="emit('update:reason', $event)"
      />
      <p v-if="props.errorMessage" class="order-dialog__error" role="alert">
        {{ props.errorMessage }}
      </p>
    </template>
    <template #actions>
      <OperationsButton
        label="Отмена"
        kind="ghost"
        compact
        :disabled="props.pending"
        @click="close"
      />
      <OperationsButton
        :label="props.pending ? 'Выполняем…' : copy.action"
        :kind="props.mode === 'reject' ? 'destructive' : 'primary'"
        compact
        :disabled="!canSubmit"
        @click="submit"
      />
    </template>
  </OperationsModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OperationsModal from "../../../shared/ui/operations/OperationsModal.vue";
import OperationsInput from "../../../shared/ui/operations/OperationsInput.vue";
import OperationsButton from "../../../shared/ui/operations/OperationsButton.vue";
import { ORDER_DIALOG_COPY } from "./OrderActionDialog.constants";
import type {
  OrderActionDialogProps,
  OrderActionDialogEmits,
} from "./OrderActionDialog.types";

const props = defineProps<OrderActionDialogProps>();
const emit = defineEmits<OrderActionDialogEmits>();
const copy = computed(() =>
  props.mode === null ? null : ORDER_DIALOG_COPY[props.mode],
);
const canSubmit = computed(
  () =>
    !props.pending &&
    (props.mode !== "reject" || !props.commandsDisabled) &&
    props.mode !== null &&
    (props.mode === "issue" || props.reason.trim().length > 0),
);

function close() {
  if (!props.pending) {
    emit("close");
  }
}

function submit() {
  if (!canSubmit.value) {
    return;
  }

  if (props.mode === "reject") {
    emit("reject", props.reason);

    return;
  }

  emit("issue");
}
</script>

<style scoped>
.order-dialog__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
</style>
