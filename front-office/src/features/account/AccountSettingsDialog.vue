<template>
  <ui-dialog
    :label="accountSettingsDialogLabel"
    max-width="28rem"
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
            <span class="account-settings__row-label">Текущий номер</span>
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
        <span class="account-settings__row-icon" aria-hidden="true">
          <Bell :size="22" :stroke-width="2.5" />
        </span>
        <div class="account-settings__row-content">
          <h3 id="account-notifications-title">Уведомления о заказах</h3>
          <p
            v-if="notificationFeedback === null"
            class="account-settings__status"
          >
            {{ description }}
          </p>
          <ui-field-message
            :message="notificationFeedback ?? ''"
            tone="error"
          />
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
          <span aria-hidden="true" class="account-settings__switch-thumb" />
        </ui-btn>
      </section>
      <footer v-if="props.authenticated" class="account-settings__footer">
        <ui-field-message :message="props.logoutError ?? ''" tone="error" />
        <ui-btn
          class="account-settings__logout"
          color="error"
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
import { Bell, LogOut, Phone, X } from "lucide-vue-next";
import { useOrderNotificationsStore } from "@/entities/customer/model/order-notifications.store";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiDialog from "@/shared/ui/customer/dialog/UiDialog.vue";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import UiFieldMessage from "@/shared/ui/customer/field-message/UiFieldMessage.vue";
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
      failed_check: "Не удалось проверить уведомления. Попробуйте ещё раз.",
      failed_enable: "Не удалось включить уведомления. Попробуйте ещё раз.",
      failed_disable: "Не удалось выключить уведомления. Попробуйте ещё раз.",
      off_current: "Включите уведомления, чтобы следить за статусом заказа.",
      on_current: "Сообщим, когда заказ примут, приготовят и выдадут.",
      other_account:
        "На этом устройстве уведомления включены для другого аккаунта.",
      anonymous_subscription: "",
      anonymous_off: "",
    })[notifications.state],
);
const notificationFeedback = computed(() => {
  if (notifications.state === "failed_check")
    return "Не удалось проверить уведомления. Попробуйте ещё раз.";
  if (notifications.state === "failed_enable")
    return "Не удалось включить уведомления. Попробуйте ещё раз.";
  if (notifications.state === "failed_disable")
    return "Не удалось выключить уведомления. Попробуйте ещё раз.";
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
    if (open && props.authenticated) void notifications.inspect();
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
  if (props.accountId !== null)
    rememberNotificationInvitationChoice(props.accountId);
}
</script>

<style scoped lang="scss">
.account-settings {
  display: grid;
  gap: var(--customer-space-7);
  max-height: min(42rem, calc(100dvh - var(--customer-space-18)));
  padding: var(--customer-space-12);
  overflow-y: auto;
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
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
  gap: var(--customer-space-6);
}
.account-settings__header h2 {
  font-size: var(--customer-font-size-2xl);
  font-weight: var(--customer-font-weight-black);
}
.account-settings__row {
  display: flex;
  align-items: center;
  gap: var(--customer-space-7);
  padding: var(--customer-space-8);
  background: var(--customer-surface-info);
  border-radius: var(--customer-radius-md);
}
.account-settings__phone {
  min-height: calc(var(--customer-size-control-xl) * 1.5);
}
.account-settings__row-icon {
  display: grid;
  flex: 0 0 var(--customer-size-control-xl);
  width: var(--customer-size-control-xl);
  height: var(--customer-size-control-xl);
  place-items: center;
  color: var(--customer-primary);
  background: var(--customer-color-blue-500-10);
  border-radius: var(--customer-radius-round);
}
.account-settings__row-content {
  display: grid;
  flex: 1;
  gap: var(--customer-space-3);
  min-width: 0;
}
.account-settings__row-label,
.account-settings__notifications h3 {
  color: var(--customer-text-on-surface);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
}
.account-settings__row-label {
  color: var(--customer-color-text-secondary-on-surface);
  font-weight: var(--customer-font-weight-semibold);
}
.account-settings__notifications h3 {
  line-height: var(--customer-line-height-label);
}
.account-settings__phone p {
  color: var(--customer-text-on-surface);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-extrabold);
}
.account-settings p {
  color: var(--customer-color-text-secondary-on-surface);
  overflow-wrap: anywhere;
}
.account-settings__status,
.account-settings__guest-message {
  line-height: var(--customer-line-height-relaxed);
}
.account-settings__switch-thumb {
  width: calc(var(--customer-size-control-sm) - var(--customer-space-6));
  height: calc(var(--customer-size-control-sm) - var(--customer-space-6));
  background: var(--customer-surface);
  border-radius: var(--customer-radius-round);
  box-shadow: var(--customer-shadow-card);
}
.account-settings .ui-btn {
  justify-self: start;
  padding: 0 var(--customer-space-8);
  border: 1px solid var(--customer-border-subtle-on-surface);
  border-radius: var(--customer-radius-pill);
  font-weight: var(--customer-font-weight-extrabold);
}
.account-settings :deep(.account-settings__notification-switch) {
  flex: 0 0 auto;
  justify-content: flex-start;
  width: calc(var(--customer-size-control-xl) + var(--customer-space-5));
  min-height: var(--customer-size-control-sm);
  padding: var(--customer-space-3);
  background: var(--customer-color-text-muted-on-surface);
  border: 0;
  border-radius: var(--customer-radius-pill);
  transition: var(--customer-transition-surface);
}
.account-settings
  :deep(.account-settings__notification-switch[aria-pressed="true"]) {
  justify-content: flex-end;
  background: var(--customer-primary);
}
.account-settings__primary {
  color: var(--customer-color-black);
  background: var(--customer-primary);
}
.account-settings :deep(.account-settings__logout) {
  justify-content: flex-start;
  width: 100%;
  min-height: calc(var(--customer-size-control-xl) * 1.5);
  gap: var(--customer-space-7);
  padding: var(--customer-space-8);
  border: 0;
  border-radius: var(--customer-radius-md);
}
.account-settings :deep(.account-settings__logout .account-settings__row-icon) {
  color: var(--customer-danger);
  background: var(--customer-danger-10);
}
.account-settings :deep(.account-settings__close) {
  color: var(--customer-text-on-surface);
  background: var(--customer-surface-info);
  border-color: var(--customer-border-subtle-on-surface);
}
.account-settings :deep(.account-settings__close:hover:not(:disabled)) {
  background: var(--customer-color-blue-500-10);
}
.account-settings__footer {
  display: grid;
  gap: var(--customer-space-5);
}
</style>
