<template>
  <Teleport to="body">
    <div
      v-if="props.modelValue"
      v-bind="dialogAttrs"
      class="admin-dialog__layer"
      :class="{
        'admin-dialog__layer--mobile': isMobile,
        'admin-dialog__layer--notice': notificationOccupiedBand > 0,
        'admin-dialog__layer--full-screen': isFullScreen,
      }"
      :style="dialogLayerStyle"
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
              :size="props.actionSize"
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
            <div
              v-if="props.destructiveLabel"
              class="admin-dialog__destructive"
            >
              <AdminButton
                class="admin-dialog__action"
                :disabled="
                  props.pending ||
                  props.destructiveDisabled ||
                  props.dismissDisabled
                "
                :size="props.actionSize"
                type="button"
                variant="destructive"
                @click="requestDestructive"
              >
                <span class="admin-dialog__action-label">{{
                  props.destructiveLabel
                }}</span>
              </AdminButton>
            </div>
            <AdminActionGroup
              v-if="props.cancelLabel || props.submitLabel"
              class="admin-dialog__primary-actions"
            >
              <div v-if="props.cancelLabel" class="admin-dialog__action-slot">
                <AdminButton
                  class="admin-dialog__action"
                  :disabled="props.pending || props.dismissDisabled"
                  :size="props.actionSize"
                  type="button"
                  variant="ghost"
                  @click="requestClose"
                >
                  <span class="admin-dialog__action-label">{{
                    props.cancelLabel
                  }}</span>
                </AdminButton>
              </div>
              <div v-if="props.submitLabel" class="admin-dialog__action-slot">
                <AdminButton
                  class="admin-dialog__action"
                  :disabled="props.submitDisabled"
                  :size="props.actionSize"
                  :form="props.submitForm"
                  :pending="props.pending"
                  type="submit"
                  :variant="props.submitVariant"
                >
                  <span class="admin-dialog__action-label">{{
                    submitLabel
                  }}</span>
                </AdminButton>
              </div>
            </AdminActionGroup>
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
  ADMIN_DIALOG_PENDING_ACTIONS,
  ADMIN_DIALOG_MOBILE_MEDIA_QUERY,
} from "./AdminDialog.constants";
import type { AdminDialogEmits, AdminDialogProps } from "./AdminDialog.types";
import AdminButton from "../admin-button/AdminButton.vue";
import AdminActionGroup from "../admin-action-group/AdminActionGroup.vue";
import AdminIcon from "../admin-icon/AdminIcon.vue";
import { notificationOccupiedBand } from "../../notifications/notification-layout";

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
const dialogLayerStyle = computed(() => ({
  "--admin-dialog-notification-band": `${notificationOccupiedBand.value}px`,
}));
const dialogContentStyle = computed(() => ({
  maxWidth: isMobile.value ? "100%" : toCssSize(props.maxWidth),
  maxHeight: isFullScreen.value
    ? "100dvh"
    : "var(--expressa-size-dialog-max-block)",
  width: "100%",
}));
const hasActions = computed(() =>
  Boolean(props.destructiveLabel || props.cancelLabel || props.submitLabel),
);
const hasHeader = computed(() => Boolean(props.title || slots.header));
const submitLabel = computed(() => {
  if (!props.pending || props.submitLabel?.endsWith("…"))
    return props.submitLabel;
  return (
    ADMIN_DIALOG_PENDING_ACTIONS.find(([label]) =>
      props.submitLabel?.startsWith(label),
    )?.[1] ?? "Выполняем…"
  );
});

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

function requestDestructive(): void {
  if (props.pending || props.destructiveDisabled || props.dismissDisabled)
    return;
  emit("destructive");
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
.admin-dialog__layer--notice {
  box-sizing: border-box;
  padding-block-start: var(--admin-dialog-notification-band);
  --admin-dialog-available-block: calc(
    100dvh - var(--admin-dialog-notification-band)
  );
}
.admin-dialog__layer--mobile {
  align-items: flex-end;
}
.admin-dialog__content {
  margin: 0;
  max-width: calc(100% - 2 * var(--expressa-space-dialog-inset));
  overflow: hidden;
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
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-md) var(--expressa-space-dialog-inset);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.admin-dialog__title {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  margin: 0;
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
}
.admin-dialog__close {
  flex: 0 0 auto;
}
.admin-dialog__surface--full-screen {
  block-size: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
  box-shadow: none;
}
.admin-dialog__layer--notice .admin-dialog__content,
.admin-dialog__layer--notice .admin-dialog__surface {
  max-height: min(
    var(--expressa-size-dialog-max-block),
    var(--admin-dialog-available-block)
  );
}
.admin-dialog__layer--notice .admin-dialog__surface--full-screen {
  block-size: 100dvh;
  padding-block-start: var(--admin-dialog-notification-band);
  max-height: 100dvh;
  box-sizing: border-box;
}
.admin-dialog__layer--notice.admin-dialog__layer--full-screen {
  padding-block-start: 0;
}
.admin-dialog__layer--notice.admin-dialog__layer--full-screen
  .admin-dialog__content {
  max-height: 100dvh;
}
.admin-dialog__footer {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-surface);
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--expressa-space-control-inline);
  padding: var(--expressa-space-md) var(--expressa-space-dialog-inset);
}
.admin-dialog__primary-actions {
  flex: 0 0 auto;
  max-width: 100%;
  margin-inline-start: auto;
}
.admin-dialog__action-slot,
.admin-dialog__destructive {
  flex: 0 0 auto;
  min-width: 0;
  max-width: 100%;
}
.admin-dialog__destructive {
  margin-inline-end: auto;
}
.admin-dialog__action {
  max-width: 100%;
}
.admin-dialog__action-label {
  overflow-wrap: anywhere;
}

.admin-dialog__body {
  min-height: 0;
  padding: var(--expressa-space-24) var(--expressa-space-dialog-inset);
  overflow-y: auto;
}

@media (max-height: 400px) {
  .admin-dialog__header,
  .admin-dialog__footer {
    padding: var(--expressa-space-dialog-compact-block)
      var(--expressa-space-dialog-compact-inline);
  }

  .admin-dialog__footer {
    gap: var(--expressa-space-sm);
  }

  .admin-dialog__body {
    padding: 0 var(--expressa-space-dialog-compact-inline)
      var(--expressa-space-dialog-compact-block);
  }
}

@media (min-width: 768px) {
  .admin-dialog__content {
    margin: var(--expressa-space-dialog-inset);
  }

  .admin-dialog__surface {
    border-radius: var(--expressa-radius-lg);
  }
  .admin-dialog__layer--notice .admin-dialog__content {
    margin-block: var(--expressa-space-sm);
    --admin-dialog-available-block: calc(
      100dvh - var(--admin-dialog-notification-band) - 2 *
        var(--expressa-space-sm)
    );
  }
}
</style>
