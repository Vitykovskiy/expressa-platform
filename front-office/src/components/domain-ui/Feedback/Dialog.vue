<template>
  <div v-if="open" class="backdrop" @click.self="close">
    <section
      class="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
      @keydown.esc="close"
    >
      <h2 :id="titleId">{{ title }}</h2>
      <p :id="descriptionId">{{ description }}</p>
      <footer>
        <button ref="cancelButton" class="cancel" type="button" @click="close">
          Отмена</button
        ><button v-if="confirmLabel" type="button" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </footer>
    </section>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
defineOptions({ name: "FoDialog" });
const props = defineProps<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
}>();
const emit = defineEmits<{ close: []; confirm: [] }>();
const cancelButton = ref<HTMLButtonElement>();
const trigger = ref<HTMLElement | null>(null);
const titleId = "fo-dialog-title";
const descriptionId = "fo-dialog-description";
function close(): void {
  emit("close");
  void nextTick(() => trigger.value?.focus());
}
watch(
  () => props.open,
  (open) => {
    if (open) {
      trigger.value =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      void nextTick(() => cancelButton.value?.focus());
    }
  },
);
onBeforeUnmount(() => trigger.value?.focus());
</script>
<style scoped>
.backdrop {
  display: grid;
  min-height: 12rem;
  place-items: center;
  padding: var(--fo-space-3);
  background: color-mix(in srgb, var(--fo-text) 55%, transparent);
}
.dialog {
  display: grid;
  gap: var(--fo-space-3);
  width: min(100%, 24rem);
  padding: var(--fo-space-4);
  border-radius: var(--fo-radius-md);
  background: var(--fo-surface);
  font: 400 1rem/1.3 var(--fo-font);
}
.dialog h2,
.dialog p {
  margin: 0;
  overflow-wrap: anywhere;
}
.dialog footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--fo-space-2);
}
.dialog button {
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-surface);
  background: var(--fo-brand);
  font: 700 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
.dialog .cancel {
  color: var(--fo-brand-dark);
  background: var(--fo-surface-muted);
}
</style>
