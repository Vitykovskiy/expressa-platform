<template>
  <v-dialog
    v-bind="dialogAttrs"
    content-class="admin-dialog__content"
    :location="dialogLocation"
    :max-height="dialogMaxHeight"
    :max-width="dialogMaxWidth"
    :model-value="props.modelValue"
    :transition="false"
    :width="dialogWidth"
    @after-enter="emit('afterEnter')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="admin-dialog__surface">
      <slot />
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
const mobileMedia =
  typeof globalThis.matchMedia === "function"
    ? globalThis.matchMedia(ADMIN_DIALOG_MOBILE_MEDIA_QUERY)
    : null;
const dialogAttrs = computed(() => ({
  "aria-describedby": attrs["aria-describedby"],
  "aria-labelledby": attrs["aria-labelledby"],
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
const dialogMaxHeight = "90vh";
const dialogWidth = computed(() => (isMobile.value ? "100%" : undefined));
defineSlots<{ default(): unknown }>();

function syncMobileLayout(): void {
  if (mobileMedia) {
    isMobile.value = mobileMedia.matches;
  }
}

onMounted(() => {
  syncMobileLayout();
  mobileMedia?.addEventListener("change", syncMobileLayout);
});

onBeforeUnmount(() => {
  mobileMedia?.removeEventListener("change", syncMobileLayout);
});
</script>

<style scoped>
:global(.admin-dialog__content) {
  margin: 0;
  overflow-y: auto;
}

.admin-dialog__surface {
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--expressa-radius-lg) var(--expressa-radius-lg) 0 0;
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
