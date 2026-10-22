<template>
  <VDialog
    v-bind="dialogAttributes"
    :model-value="props.open"
    :width="dialogWidth"
    :max-width="dialogMaxWidth"
    :persistent="props.persistent"
    :opacity="0.4"
    scrim="#000000"
    :transition="false"
    :content-props="contentProps"
    @update:model-value="updateOpen"
  >
    <section v-bind="$attrs" class="operations-modal" :class="modalClass">
      <header class="operations-modal__header">
        <slot name="header" :title-id="titleId">
          <h2 :id="titleId" class="operations-modal__title">
            {{ props.title }}
          </h2>
          <p v-if="props.description" class="operations-modal__description">
            {{ props.description }}
          </p>
        </slot>
      </header>
      <div v-if="slots.default" class="operations-modal__body"><slot /></div>
      <footer v-if="slots.actions" class="operations-modal__actions">
        <slot name="actions" />
      </footer>
    </section>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, shallowRef, useId } from "vue";
import { VDialog } from "vuetify/components/VDialog";
import {
  MODAL_CONTENT_STYLE,
  MODAL_DEFAULTS,
  MOBILE_SHEET_QUERY,
  MODAL_SHEET_STYLE,
} from "./OperationsModal.constants";
import type {
  OperationsModalEmits,
  OperationsModalProps,
  OperationsModalSlots,
} from "./OperationsModal.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<OperationsModalProps>(), MODAL_DEFAULTS);
const emit = defineEmits<OperationsModalEmits>();
const slots = defineSlots<OperationsModalSlots>();
const titleId = useId();
const dialogAttributes = { "aria-labelledby": titleId };
const mobileViewport = shallowRef(false);
let stopWatchingViewport: (() => void) | null = null;

const sheetActive = computed(() => props.bottomSheet && mobileViewport.value);
const dialogWidth = computed(() => (sheetActive.value ? "100vw" : props.width));
const dialogMaxWidth = computed(() =>
  sheetActive.value ? "100vw" : "calc(100vw - 32px)",
);
const modalClass = computed(() => [
  `operations-modal--${props.layout}`,
  { "operations-modal--sheet": sheetActive.value },
]);
const contentProps = computed(() => ({
  style: sheetActive.value ? MODAL_SHEET_STYLE : MODAL_CONTENT_STYLE,
  "aria-labelledby": titleId,
}));

onMounted(() => {
  const viewport = globalThis.matchMedia(MOBILE_SHEET_QUERY);
  const updateViewport = () => {
    mobileViewport.value = viewport.matches;
  };

  updateViewport();
  viewport.addEventListener("change", updateViewport);
  stopWatchingViewport = () =>
    viewport.removeEventListener("change", updateViewport);
});

onScopeDispose(() => {
  stopWatchingViewport?.();
});

function updateOpen(value: boolean) {
  if (!value) {
    emit("close");
  }
}
</script>

<style scoped>
.operations-modal {
  width: 100%;
  padding: 24px;
  overflow-y: auto;
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
}
.operations-modal__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
}
.operations-modal--confirmation .operations-modal__header {
  padding-bottom: 16px;
}
.operations-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.operations-modal__description {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}
.operations-modal__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 24px;
}
.operations-modal__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.operations-modal--confirmation .operations-modal__body {
  padding-bottom: 16px;
}

.operations-modal--sheet {
  max-height: 100dvh;
}
</style>
