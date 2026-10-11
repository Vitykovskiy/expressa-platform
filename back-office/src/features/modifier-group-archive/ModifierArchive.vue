<template>
  <UiDialog
    :open="open"
    title="Архивировать группу?"
    :dismissible="!sending"
    @update:open="emit('close')"
  >
    <div class="modifier-archive">
      <p>{{ name }}</p>
      <p>Группа перестанет отображаться в меню. Добавки и связи сохранятся.</p>
      <ModifierOperation
        v-if="operation"
        :operation="operation"
        :disabled="disabled"
        @reconcile="emit('reconcile')"
        @refresh="emit('refresh')"
        @leave="emit('leave')"
      />
    </div>
    <template #actions>
      <UiButton
        variant="secondary"
        :disabled="sending"
        @activate="emit('close')"
        >Отмена</UiButton
      >
      <UiButton
        v-if="!operation || checking || sending"
        variant="danger"
        :loading="sending"
        :disabled="confirmDisabled || checking"
        @activate="emit('confirm')"
        >Архивировать</UiButton
      >
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import UiDialog from "../../shared/ui/UiDialog/UiDialog.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import ModifierOperation from "../modifier-group-edit/ModifierOperation.vue";
import type {
  ModifierArchiveProps,
  ModifierArchiveEmits,
} from "./ModifierArchive.types";

const props = defineProps<ModifierArchiveProps>();
const emit = defineEmits<ModifierArchiveEmits>();
const sending = computed(() => props.operation?.status === "sending");
const checking = computed(() => props.operation?.status === "checking");

watch(
  () => props.operation?.status,
  (status) => {
    if (!props.open || (status !== "checking" && status !== "sending")) return;
    const surface = document.activeElement?.closest(".ui-dialog");

    if (surface instanceof HTMLElement) surface.focus();
  },
  { flush: "sync" },
);
</script>

<style scoped>
.modifier-archive {
  display: grid;
  gap: var(--space-lg);
  overflow-wrap: anywhere;
}
</style>
