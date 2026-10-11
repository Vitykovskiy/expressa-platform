<template>
  <UiDialog
    :open="open"
    title="Архивировать категорию?"
    :dismissible="!sending"
    @update:open="emit('close')"
  >
    <div class="category-archive">
      <p>{{ name }}</p>
      <p>
        Категория и её товары перестанут отображаться в меню и разделе
        «Доступность».
      </p>
      <CategoryOperation
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
        v-if="canConfirm"
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
import CategoryOperation from "../category-edit/CategoryOperation.vue";
import type {
  CategoryArchiveProps,
  CategoryArchiveEmits,
} from "./CategoryArchive.types";

const props = defineProps<CategoryArchiveProps>();
const emit = defineEmits<CategoryArchiveEmits>();
const sending = computed(() => props.operation?.status === "sending");
const checking = computed(() => props.operation?.status === "checking");
const canConfirm = computed(
  () => props.operation === null || checking.value || sending.value,
);

watch(
  () => props.operation?.status,
  (status) => {
    if (status !== "checking" && status !== "sending") return;

    const surface = document.activeElement?.closest(".ui-dialog");

    if (surface instanceof HTMLElement) surface.focus();
  },
  { flush: "sync" },
);
</script>

<style scoped>
.category-archive {
  display: grid;
  gap: var(--space-lg);
}
</style>
