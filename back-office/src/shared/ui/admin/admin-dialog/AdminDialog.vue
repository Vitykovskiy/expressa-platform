<template>
  <v-dialog
    v-bind="dialogAttrs"
    content-class="admin-dialog__content"
    :location="dialogLocation"
    :max-height="dialogMaxHeight"
    :max-width="dialogMaxWidth"
    :model-value="props.modelValue"
    :persistent="props.persistent"
    :transition="false"
    :width="dialogWidth"
    @after-enter="emit('afterEnter')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      class="admin-dialog__surface"
      :class="{ 'admin-dialog__surface--full-screen': isFullScreen }"
    >
      <header v-if="slots.header" class="admin-dialog__header">
        <slot name="header" />
      </header>
      <div class="admin-dialog__body">
        <slot />
      </div>
      <footer v-if="slots.footer" class="admin-dialog__footer">
        <slot name="footer" />
      </footer>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useAttrs,
} from "vue";
import {
  ADMIN_DIALOG_DEFAULTS,
  ADMIN_DIALOG_MOBILE_MEDIA_QUERY,
} from "./AdminDialog.constants";
import type { AdminDialogEmits, AdminDialogProps } from "./AdminDialog.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminDialogProps>(),
  ADMIN_DIALOG_DEFAULTS,
);
const emit = defineEmits<AdminDialogEmits>();
const attrs = useAttrs();
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
  role: attrs.role,
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
  isFullScreen.value ? "100dvh" : "90vh",
);
const dialogWidth = computed(() =>
  isMobile.value || isFullScreen.value ? "100%" : undefined,
);
const slots = defineSlots<{
  default(): unknown;
  footer?(): unknown;
  header?(): unknown;
}>();

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

onBeforeUnmount(() => {
  mobileMedia?.removeEventListener("change", syncMobileLayout);
  fullScreenMedia?.removeEventListener("change", syncMobileLayout);
});
</script>

<style scoped>
:global(.admin-dialog__content) {
  margin: 0;
  overflow-y: auto;
}

.admin-dialog__surface {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  background: var(--expressa-color-surface);
  border-radius: var(--expressa-radius-lg) var(--expressa-radius-lg) 0 0;
}
.admin-dialog__surface--full-screen {
  block-size: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
}

.admin-dialog__header,
.admin-dialog__footer {
  flex: 0 0 auto;
}

.admin-dialog__footer {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.admin-dialog__body {
  min-height: 0;
  overflow-y: auto;
}

@media (min-width: 768px) {
  :global(.admin-dialog__content) {
    margin: 24px;
  }

  .admin-dialog__surface {
    border-radius: var(--expressa-radius-lg);
  }
}
</style>
