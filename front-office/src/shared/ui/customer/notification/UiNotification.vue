<template>
  <Teleport to="body">
    <div
      v-if="visible && props.message"
      class="ui-notification"
      :role="props.role"
      aria-atomic="true"
    >
      <p class="ui-notification__message">{{ props.message }}</p>
      <UiIconBtn
        class="ui-notification__close"
        aria-label="Закрыть уведомление"
        @click="close"
      >
        <X :size="18" aria-hidden="true" />
      </UiIconBtn>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { shallowRef, watch } from "vue";
import { X } from "lucide-vue-next";
import UiIconBtn from "../icon-btn/UiIconBtn.vue";
import {
  UI_NOTIFICATION_DEFAULTS,
  UI_NOTIFICATION_DURATION_MS,
} from "./UiNotification.constants";
import type {
  UiNotificationEmits,
  UiNotificationProps,
} from "./UiNotification.types";

const props = withDefaults(
  defineProps<UiNotificationProps>(),
  UI_NOTIFICATION_DEFAULTS,
);
const emit = defineEmits<UiNotificationEmits>();
const visible = shallowRef(false);

function close(): void {
  if (!visible.value) {
    return;
  }

  visible.value = false;
  emit("close");
}

watch(
  () => props.message,
  (message, _previous, onCleanup) => {
    visible.value = message !== null;
    if (message === null) {
      return;
    }

    const timeout = window.setTimeout(close, UI_NOTIFICATION_DURATION_MS);

    onCleanup(() => window.clearTimeout(timeout));
  },
  { immediate: true },
);
</script>

<style scoped>
.ui-notification {
  position: fixed;
  z-index: 5;
  top: calc(var(--customer-size-shell-header) + var(--customer-space-9));
  right: max(var(--customer-space-9), env(safe-area-inset-right));
  display: flex;
  align-items: center;
  gap: var(--customer-space-5);
  /* Для ширины уведомления принятого макета нет отдельного токена компоновки. */
  width: min(26.25rem, calc(100% - var(--customer-space-16)));
  padding: var(--customer-space-7);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
  box-shadow: var(--customer-shadow-floating);
}
.ui-notification__message {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--customer-font-size-body);
  overflow-wrap: anywhere;
}
.ui-notification__close {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  color: var(--customer-text-on-surface);
  background: transparent;
  border: 0;
  border-radius: var(--customer-radius-sm);
}
.ui-notification__close:hover:not(:disabled) {
  background: var(--customer-surface-info);
}
@media (min-width: 1024px) {
  .ui-notification {
    top: var(--customer-space-13);
    right: var(--customer-space-13);
    width: 22.5rem; /* Ширина уведомления 360px для настольного экрана; отдельного токена нет. */
  }
}
</style>
