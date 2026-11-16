<template>
  <ui-dialog
    :label="accountSettingsDialogLabel"
    max-width="28rem"
    :width="'calc(100% - 3rem)'"
    :model-value="props.modelValue"
    :return-focus-to="props.returnFocusTo"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <section class="account-settings" aria-labelledby="account-settings-title">
      <header class="account-settings__header">
        <h2 id="account-settings-title">Аккаунт</h2>
        <ui-icon-btn
          class="account-settings__close"
          aria-label="Закрыть настройки аккаунта"
          type="button"
          @click="emit('update:modelValue', false)"
        >
          <X aria-hidden="true" :size="18" :stroke-width="2.5" />
        </ui-icon-btn>
      </header>
      <template v-if="props.authenticated">
        <div class="account-settings__row account-settings__phone">
          <span class="account-settings__row-icon" aria-hidden="true">
            <Phone :size="22" :stroke-width="2.5" />
          </span>
          <div class="account-settings__row-content">
            <span class="account-settings__row-label">Номер телефона</span>
            <p>{{ props.accountLabel }}</p>
          </div>
        </div>
      </template>
      <template v-else>
        <p class="account-settings__guest-message">Вы не вошли в аккаунт</p>
        <ui-btn
          class="account-settings__primary"
          type="button"
          @click="emit('signIn')"
          >Войти</ui-btn
        >
      </template>
      <section
        v-if="props.authenticated"
        class="account-settings__row account-settings__notifications"
        aria-labelledby="account-notifications-title"
      >
        <div class="account-settings__row-content">
          <h3 id="account-notifications-title">Уведомления о заказах</h3>
          <p class="account-settings__status">
            {{ description }}
          </p>
        </div>
        <ui-btn
          v-if="notificationControl !== null"
          class="account-settings__notification-switch"
          type="button"
          :aria-label="notificationControl.label"
          :aria-pressed="notificationControl.isEnabled"
          :disabled="isBusy"
          :loading="notifications.operation !== null"
          @click="runNotificationAction(notificationControl.action)"
        >
          <span aria-hidden="true" class="account-settings__switch-track">
            <span class="account-settings__switch-thumb" />
          </span>
        </ui-btn>
      </section>
      <footer v-if="props.authenticated" class="account-settings__footer">
        <ui-btn
          class="account-settings__logout"
          :disabled="notifications.operation !== null"
          type="button"
          :loading="props.logoutPending"
          @click="emit('signOut')"
        >
          <span class="account-settings__row-icon" aria-hidden="true">
            <LogOut :size="22" :stroke-width="2.5" />
          </span>
          <span>Выйти из аккаунта</span>
        </ui-btn>
      </footer>
    </section>
  </ui-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { LogOut, Phone, X } from "lucide-vue-next";
import { useOrderNotificationsStore } from "@/entities/customer/model/order-notifications.store";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiDialog from "@/shared/ui/customer/dialog/UiDialog.vue";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import { rememberNotificationInvitationChoice } from "@/entities/customer/model/notification-invitation";
import { accountSettingsDialogLabel } from "./AccountSettingsDialog.constants";
import type {
  AccountSettingsDialogEmits,
  AccountSettingsDialogProps,
} from "./AccountSettingsDialog.types";

const props = defineProps<AccountSettingsDialogProps>();
const emit = defineEmits<AccountSettingsDialogEmits>();
const notifications = useOrderNotificationsStore();
const isBusy = computed(
  () => notifications.operation !== null || props.logoutPending,
);
const description = computed(
  () =>
    ({
      checking: "Проверяем уведомления…",
      unsupported: "Этот браузер не поддерживает уведомления.",
      denied: "Уведомления заблокированы в настройках устройства или браузера.",
      failed_check: "Проверьте, включены ли уведомления о заказах.",
      failed_enable: "Сообщим, когда заказ будет готов.",
      failed_disable: "Сообщим, когда заказ будет готов.",
      off_current: "Сообщим, когда заказ будет готов.",
      on_current: "Сообщим, когда заказ будет готов.",
      other_account:
        "На этом устройстве уведомления включены для другого аккаунта.",
      anonymous_subscription: "",
      anonymous_off: "",
    })[notifications.state],
);
const notificationFeedback = computed(() => {
  if (notifications.state === "failed_check") {
    return "Не удалось проверить уведомления. Попробуйте ещё раз.";
  }

  if (notifications.state === "failed_enable") {
    return "Не удалось включить уведомления. Попробуйте ещё раз.";
  }

  if (notifications.state === "failed_disable") {
    return "Не удалось выключить уведомления. Попробуйте ещё раз.";
  }

  return null;
});
const notificationControl = computed(() => {
  switch (notifications.state) {
    case "denied":
      return {
        action: "inspect" as const,
        isEnabled: false,
        label: "Проверить уведомления снова",
      };
    case "failed_check":
      return {
        action: "inspect" as const,
        isEnabled: false,
        label: "Повторить проверку уведомлений",
      };
    case "off_current":
    case "other_account":
    case "failed_enable":
      return {
        action: "enable" as const,
        isEnabled: false,
        label: "Включить уведомления о заказах",
      };
    case "on_current":
    case "failed_disable":
      return {
        action: "disable" as const,
        isEnabled: true,
        label:
          notifications.state === "failed_disable"
            ? "Повторить выключение уведомлений"
            : "Выключить уведомления о заказах",
      };
    case "anonymous_off":
    case "anonymous_subscription":
    case "checking":
    case "unsupported":
      return null;
  }

  return null;
});

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.authenticated) {
      void notifications.inspect();
    }
  },
);

watch(
  () => notifications.operation,
  (operation, previousOperation) => {
    if (operation !== null || previousOperation === null || !props.modelValue) {
      return;
    }

    if (props.authenticated && notificationFeedback.value !== null) {
      emit("feedback", notificationFeedback.value);
    }
  },
);

watch(
  () => props.logoutError,
  (message) => {
    if (message !== null) {
      emit("feedback", message);
    }
  },
);

function enable(): Promise<void> {
  rememberChoice();

  return notifications.enable(notifications.state === "other_account");
}

function disable(): Promise<void> {
  rememberChoice();

  return notifications.disable();
}

function runNotificationAction(
  action: "inspect" | "enable" | "disable",
): Promise<void> {
  switch (action) {
    case "inspect":
      return notifications.inspect();
    case "enable":
      return enable();
    case "disable":
      return disable();
  }
}

function rememberChoice(): void {
  if (props.accountId !== null) {
    rememberNotificationInvitationChoice(props.accountId);
  }
}
</script>

<style scoped>
.account-settings {
  display: grid;
  gap: var(--customer-space-9);
  max-height: calc(100dvh - var(--customer-space-18));
  padding: var(--customer-space-11);
  overflow-y: auto;
  color: var(--customer-text);
  background: var(--customer-surface-account);
  border-radius: var(--customer-space-12);
}
.account-settings h2,
.account-settings h3,
.account-settings p {
  margin: 0;
}
.account-settings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--customer-space-5);
}
.account-settings__header h2 {
  font-size: var(--customer-font-size-4xl);
  font-weight: var(--customer-font-weight-black);
}
.account-settings__close {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  color: var(--customer-text);
  background: var(--customer-color-surface-subtle);
  border: 0;
}
.account-settings__close:hover:not(:disabled) {
  background: var(--customer-surface-control);
}
.account-settings__row {
  display: flex;
  align-items: center;
  gap: var(--customer-space-7);
}
.account-settings__row-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: inherit;
}
.account-settings__row-content {
  display: grid;
  flex: 1;
  gap: var(--customer-space-3);
  min-width: 0;
}
.account-settings__row-label {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-body);
}
.account-settings__notifications {
  gap: var(--customer-space-6);
  padding: var(--customer-space-7);
  background: var(--customer-color-surface-subtle);
  border-radius: var(--customer-radius-md);
}
.account-settings__notifications h3 {
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
  line-height: var(--customer-line-height-label);
}
.account-settings p {
  overflow-wrap: anywhere;
}
.account-settings__phone p {
  font-size: var(--customer-font-size-4xl);
  font-weight: var(--customer-font-weight-extrabold);
  line-height: var(--customer-line-height-label);
}
.account-settings__status,
.account-settings__guest-message {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-body);
  line-height: var(--customer-line-height-label);
}
.account-settings__notification-switch {
  flex: 0 0 60px;
  width: 60px;
  min-height: 44px;
  border-radius: var(--customer-radius-pill);
}
.account-settings__switch-track {
  display: flex;
  align-items: center;
  width: var(--customer-size-control-xl);
  height: var(--customer-size-control-sm);
  padding: var(--customer-space-3);
  background: var(--customer-color-white-85);
  border: 2px solid var(--customer-color-white-50);
  border-radius: var(--customer-radius-pill);
}
.account-settings__switch-thumb {
  width: var(--customer-space-9);
  height: var(--customer-space-9);
  background: var(--customer-surface-account);
  border-radius: var(--customer-radius-round);
}
.account-settings__notification-switch[aria-pressed="true"]
  .account-settings__switch-track {
  justify-content: flex-end;
  background: var(--customer-surface);
}
.account-settings__primary,
.account-settings__logout {
  min-height: 48px;
  padding: var(--customer-space-6);
  color: var(--customer-text);
  border: 1px solid var(--customer-color-text-muted-on-brand);
  border-radius: var(--customer-radius-md);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-extrabold);
}
.account-settings__logout {
  width: 100%;
  gap: var(--customer-space-6);
}
.account-settings__primary:hover:not(:disabled),
.account-settings__logout:hover:not(:disabled) {
  background: var(--customer-color-surface-subtle);
}
.account-settings__footer {
  padding-top: var(--customer-space-9);
  border-top: 1px solid var(--customer-border);
}
</style>
