<template>
  <div class="staff-workspace">
    <AppNavigation
      :administrator="administrator"
      :section="section"
      :links="links"
      @navigate="forwardNavigation"
      @logout="emit('logout')"
    >
      <template #actions
        ><button
          v-if="!administrator"
          class="quiet-action"
          type="button"
          @click="emit('showNotifications')"
        >
          Уведомления
        </button></template
      >
      <template #selection
        ><div v-if="notificationOrder" role="status" aria-live="polite">
          <p class="selection-message">{{ notificationMessage }}</p>
          <button
            class="quiet-action"
            type="button"
            :disabled="navigationBusy"
            @click="emit('openNotification')"
          >
            Открыть выбранный заказ
          </button>
        </div></template
      >
    </AppNavigation>
    <div class="mobile-account" :class="mobileAccountClasses">
      <button
        v-if="!administrator"
        class="quiet-action"
        type="button"
        @click="emit('showNotifications')"
      >
        Уведомления</button
      ><button class="quiet-action" type="button" @click="emit('logout')">
        Выйти
      </button>
    </div>
    <div
      v-if="notificationOrder"
      class="mobile-selection"
      role="status"
      aria-live="polite"
    >
      <p class="selection-message">{{ notificationMessage }}</p>
      <button
        class="quiet-action"
        type="button"
        :disabled="navigationBusy"
        @click="emit('openNotification')"
      >
        Открыть выбранный заказ
      </button>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppNavigation from "./AppNavigation.vue";
import type {
  AppLayoutProps,
  AppLayoutEmits,
  AppLayoutSlots,
} from "./AppLayout.types";

const props = defineProps<AppLayoutProps>();
const emit = defineEmits<AppLayoutEmits>();

defineSlots<AppLayoutSlots>();

const mobileAccountClasses = computed(() => ({
  "orders-account": props.section === "orders",
}));

function forwardNavigation(event: globalThis.MouseEvent, href: string) {
  emit("navigate", event, href);
}
</script>

<style scoped>
.staff-workspace {
  display: flex;
  width: 100%;
  height: 100dvh;
  min-width: 0;
}
.quiet-action {
  border: 0;
  padding: 12px;
  background: transparent;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  cursor: pointer;
}
.mobile-selection {
  display: none;
}
.selection-message {
  margin: 0;
  padding: 8px 12px 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--color-foreground-muted);
}
.mobile-account {
  display: none;
}
@media (max-width: 767px) {
  .mobile-selection {
    position: fixed;
    display: block;
    z-index: 4;
    bottom: 60px;
    right: 0;
    background: var(--color-surface);
  }
  .mobile-account {
    position: fixed;
    z-index: 3;
    right: 8px;
    top: 4px;
    display: flex;
  }
  .quiet-action {
    padding: 8px;
    font-size: 11px;
  }
  .orders-account {
    right: 48px;
  }
}
</style>
