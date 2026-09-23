<template>
  <Teleport to="body">
    <div
      v-if="props.modelValue"
      v-bind="dialogAttrs"
      class="admin-dialog__layer"
      :class="{ 'admin-dialog__layer--mobile': isMobile }"
      @click.self="requestBackdropClose"
    >
      <div class="admin-dialog__content" :style="dialogContentStyle">
        <div
          class="admin-dialog__surface"
          :class="{ 'admin-dialog__surface--full-screen': isFullScreen }"
        >
          <header v-if="hasHeader" class="admin-dialog__header">
            <h2 v-if="props.title" class="admin-dialog__title">
              {{ props.title }}
            </h2>
            <slot v-else name="header" />
            <AdminButton
              class="admin-dialog__close"
              :disabled="props.pending || props.dismissDisabled"
              type="button"
              variant="ghost"
              @click="requestClose"
            >
              <AdminIcon :icon="X" />
            </AdminButton>
          </header>
          <div class="admin-dialog__body">
            <slot />
          </div>
          <footer v-if="hasActions" class="admin-dialog__footer">
            <AdminButton
              v-if="props.cancelLabel"
              :disabled="props.pending || props.dismissDisabled"
              :size="props.actionSize"
              type="button"
              variant="ghost"
              @click="requestClose"
            >
              {{ props.cancelLabel }}
            </AdminButton>
            <AdminButton
              v-if="props.submitLabel"
              :disabled="props.submitDisabled"
              :size="props.actionSize"
              :form="props.submitForm"
              :pending="props.pending"
              type="submit"
              :variant="props.submitVariant"
            >
              {{ props.submitLabel }}
            </AdminButton>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import { X } from "lucide-vue-next";
import {
  ADMIN_DIALOG_DEFAULTS,
  ADMIN_DIALOG_MOBILE_MEDIA_QUERY,
} from "./AdminDialog.constants";
import type { AdminDialogEmits, AdminDialogProps } from "./AdminDialog.types";
import AdminButton from "../admin-button/AdminButton.vue";
import AdminIcon from "../admin-icon/AdminIcon.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminDialogProps>(),
  ADMIN_DIALOG_DEFAULTS,
);
const emit = defineEmits<AdminDialogEmits>();
const attrs = useAttrs();
const slots = useSlots();
const isMobile = shallowRef(true);
const isFullScreen = shallowRef(false);
const mobileMedia =
  typeof globalThis.matchMedia === "function"
    ? globalThis.matchMedia(ADMIN_DIALOG_MOBILE_MEDIA_QUERY)
    : null;
const fullScreenMedia =
  typeof globalThis.matchMedia === "function"
    ? globalThis.matchMedia("(max-width: 599px)")
    : null;
const dialogAttrs = computed(() => ({
  class: attrs.class,
  "data-testid": attrs["data-testid"],
  style: attrs.style,
}));
const dialogContentStyle = computed(() => ({
  maxWidth: isMobile.value ? "100%" : toCssSize(props.maxWidth),
  maxHeight: isFullScreen.value
    ? "100dvh"
    : "var(--expressa-size-dialog-max-block)",
  width: "100%",
}));
const hasActions = computed(() =>
  Boolean(props.cancelLabel || props.submitLabel),
);
const hasHeader = computed(() => Boolean(props.title || slots.header));

function toCssSize(value: number | string | undefined): string | undefined {
  return typeof value === "number" || /^\d+(\.\d+)?$/.test(value ?? "")
    ? `${value}px`
    : value;
}

function requestClose(): void {
  if (props.pending || props.dismissDisabled) return;
  emit("cancel");
  emit("update:modelValue", false);
}

function requestBackdropClose(): void {
  if (props.persistent) return;
  requestClose();
}

function syncMobileLayout(): void {
  if (mobileMedia) {
    isMobile.value = mobileMedia.matches;
  }
  isFullScreen.value =
    props.fullScreenBelow600 === true && fullScreenMedia?.matches === true;
}

onMounted(() => {
  syncMobileLayout();
  mobileMedia?.addEventListener("change", syncMobileLayout);
  fullScreenMedia?.addEventListener("change", syncMobileLayout);
});

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      await nextTick();
      emit("afterEnter");
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  mobileMedia?.removeEventListener("change", syncMobileLayout);
  fullScreenMedia?.removeEventListener("change", syncMobileLayout);
});
</script>

<style scoped>
.admin-dialog__layer {
  position: fixed;
  z-index: var(--expressa-z-modal-layer);
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--expressa-color-overlay);
}
.admin-dialog__layer--mobile {
  align-items: flex-end;
}
.admin-dialog__content {
  margin: 0;
  max-width: calc(100% - 2 * var(--expressa-space-dialog-inset));
  overflow-y: auto;
}

.admin-dialog__surface {
  display: flex;
  flex-direction: column;
  max-height: var(--expressa-size-dialog-max-block);
  background: var(--expressa-color-surface);
  border-radius: var(--expressa-radius-lg) var(--expressa-radius-lg) 0 0;
  box-shadow: var(--expressa-shadow-modal);
}
.admin-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-lg) var(--expressa-space-dialog-inset);
}
.admin-dialog__title {
  margin: 0;
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
}
.admin-dialog__surface--full-screen {
  block-size: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
  box-shadow: none;
}

.admin-dialog__footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: var(--expressa-space-control-inline);
  padding: var(--expressa-space-lg) var(--expressa-space-dialog-inset);
}

.admin-dialog__body {
  min-height: 0;
  padding: 0 var(--expressa-space-dialog-inset) var(--expressa-space-lg);
  overflow-y: auto;
}

@media (min-width: 768px) {
  .admin-dialog__content {
    margin: var(--expressa-space-dialog-inset);
  }

  .admin-dialog__surface {
    border-radius: var(--expressa-radius-lg);
  }
}
</style>
