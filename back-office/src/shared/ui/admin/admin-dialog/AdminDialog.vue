<template>
  <v-dialog
    v-bind="dialogAttrs"
    content-class="admin-dialog__content"
    :location="dialogLocation"
    :max-height="dialogMaxHeight"
    :max-width="dialogMaxWidth"
    :model-value="props.modelValue"
    :persistent="props.persistent || props.pending || props.dismissDisabled"
    :transition="false"
    :width="dialogWidth"
    @after-enter="emit('afterEnter')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      ref="surface"
      class="admin-dialog__surface"
      :class="{ 'admin-dialog__surface--full-screen': isFullScreen }"
    >
      <header v-if="hasHeader" class="admin-dialog__header">
        <h2 v-if="props.title" :id="titleId" class="admin-dialog__title">
          {{ props.title }}
        </h2>
        <slot v-else name="header" />
        <AdminButton
          :aria-label="props.closeLabel"
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
          type="button"
          variant="ghost"
          @click="requestClose"
        >
          {{ props.cancelLabel }}
        </AdminButton>
        <AdminButton
          v-if="props.submitLabel"
          :disabled="props.submitDisabled"
          :form="props.submitForm"
          :pending="props.pending"
          type="submit"
          :variant="props.submitVariant"
        >
          {{ props.pending ? props.submitPendingLabel : props.submitLabel }}
        </AdminButton>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
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
import { overlayCoordinatorKey } from "../../overlay/overlay-coordinator.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminDialogProps>(),
  ADMIN_DIALOG_DEFAULTS,
);
const emit = defineEmits<AdminDialogEmits>();
const attrs = useAttrs();
const slots = useSlots();
const overlayCoordinator = inject(overlayCoordinatorKey, null);
const surface = shallowRef<HTMLElement | null>(null);
let unregisterModalRegion: (() => void) | null = null;
const titleId = computed(() =>
  typeof attrs["aria-labelledby"] === "string"
    ? attrs["aria-labelledby"]
    : undefined,
);
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
  "aria-describedby": attrs["aria-describedby"],
  "aria-labelledby": attrs["aria-labelledby"],
  "aria-modal": attrs["aria-modal"] ?? true,
  role: attrs.role ?? "dialog",
  class: attrs.class,
  "data-testid": attrs["data-testid"],
  style: attrs.style,
}));
const dialogLocation = computed(() =>
  isMobile.value ? "bottom center" : "center center",
);
const dialogMaxWidth = computed(() =>
  isMobile.value ? "100%" : props.maxWidth,
);
const dialogMaxHeight = computed(() =>
  isFullScreen.value ? "100dvh" : "var(--expressa-size-dialog-max-block)",
);
const dialogWidth = computed(() =>
  isMobile.value || isFullScreen.value ? "100%" : undefined,
);
const hasActions = computed(() =>
  Boolean(props.cancelLabel || props.submitLabel),
);
const hasHeader = computed(() => Boolean(props.title || slots.header));

function requestClose(): void {
  if (props.pending || props.dismissDisabled) return;
  emit("cancel");
  emit("update:modelValue", false);
}

function syncModalRegion(isOpen: boolean): void {
  unregisterModalRegion?.();
  unregisterModalRegion = null;
  if (!isOpen || !surface.value || !overlayCoordinator) return;
  const primary = surface.value.querySelector<HTMLElement>(
    "button:not(:disabled)",
  );
  unregisterModalRegion = overlayCoordinator.registerModalRegion(
    surface.value,
    primary,
  );
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
  void nextTick(() => syncModalRegion(props.modelValue));
});

onBeforeUnmount(() => {
  mobileMedia?.removeEventListener("change", syncMobileLayout);
  fullScreenMedia?.removeEventListener("change", syncMobileLayout);
  unregisterModalRegion?.();
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    await nextTick();
    syncModalRegion(isOpen);
  },
);
</script>

<style scoped>
:global(.admin-dialog__content) {
  margin: 0;
  overflow-y: auto;
}

.admin-dialog__surface {
  display: flex;
  flex-direction: column;
  max-height: var(--expressa-size-dialog-max-block);
  background: var(--expressa-color-surface);
  border-radius: var(--expressa-radius-lg) var(--expressa-radius-lg) 0 0;
}
.admin-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-md) var(--expressa-space-lg);
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
}

.admin-dialog__footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: var(--expressa-space-control-inline);
  padding: var(--expressa-space-md) var(--expressa-space-lg);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.admin-dialog__body {
  min-height: 0;
  overflow-y: auto;
}

@media (min-width: 768px) {
  :global(.admin-dialog__content) {
    margin: var(--expressa-space-dialog-inset);
  }

  .admin-dialog__surface {
    border-radius: var(--expressa-radius-lg);
  }
}
</style>
