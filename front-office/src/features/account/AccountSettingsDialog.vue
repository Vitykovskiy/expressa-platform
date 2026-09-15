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
        <div class="account-settings__phone">
          <span>Телефон</span>
          <p>{{ props.accountLabel }}</p>
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
        class="account-settings__notifications"
        aria-labelledby="account-notifications-title"
      >
        <h3 id="account-notifications-title">Уведомления о заказах</h3>
        <p
          v-if="notificationFeedback === null"
          class="account-settings__status"
        >
          {{ description }}
        </p>
        <ui-field-message :message="notificationFeedback ?? ''" tone="error" />
        <ui-btn
          v-if="
            notifications.state === 'denied' ||
            notifications.state === 'failed_check'
          "
          type="button"
          :disabled="isBusy"
          :loading="notifications.operation !== null"
          @click="notifications.inspect"
          >{{
            notifications.state === "denied" ? "Проверить снова" : "Повторить"
          }}</ui-btn
        >
        <ui-btn
          v-else-if="
            notifications.state === 'off_current' ||
            notifications.state === 'other_account' ||
            notifications.state === 'failed_enable'
          "
          class="account-settings__primary"
          type="button"
          :disabled="isBusy"
          :loading="notifications.operation !== null"
          @click="enable"
          >Включить уведомления</ui-btn
        >
        <ui-btn
          v-else-if="
            notifications.state === 'on_current' ||
            notifications.state === 'failed_disable'
          "
          type="button"
          :disabled="isBusy"
          :loading="notifications.operation !== null"
          @click="disable"
          >{{
            notifications.state === "failed_disable"
              ? "Повторить"
              : "Отключить уведомления"
          }}</ui-btn
        >
      </section>
      <footer v-if="props.authenticated" class="account-settings__footer">
        <ui-field-message :message="props.logoutError ?? ''" tone="error" />
        <ui-btn
          color="error"
          :disabled="notifications.operation !== null"
          type="button"
          :loading="props.logoutPending"
          @click="emit('signOut')"
          >Выйти из аккаунта</ui-btn
        >
      </footer>
    </section>
  </ui-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { X } from "lucide-vue-next";
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
      unsupported: "Уведомления недоступны в этом браузере.",
      denied: "Уведомления запрещены в настройках устройства или браузера.",
      failed_check: "Не удалось проверить уведомления. Попробуйте ещё раз.",
      failed_enable: "Не удалось включить уведомления. Попробуйте ещё раз.",
      failed_disable:
        "Не удалось отключить уведомления на этом устройстве. Попробуйте ещё раз.",
      off_current:
        "Уведомления выключены. Сообщим, когда заказ примут, приготовят и выдадут.",
      on_current: "Уведомления включены.",
      other_account:
        "Уведомления выключены. Сообщим, когда заказ примут, приготовят и выдадут.",
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
    return "Не удалось отключить уведомления на этом устройстве. Попробуйте ещё раз.";
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

function rememberChoice(): void {
  if (props.accountId !== null)
    rememberNotificationInvitationChoice(props.accountId);
}
</script>

<style scoped lang="scss">
.account-settings {
  display: grid;
  gap: var(--customer-space-9);
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
.account-settings__notifications {
  display: grid;
  gap: var(--customer-space-5);
  padding: var(--customer-space-8);
  background: var(--customer-surface-info);
  border-radius: var(--customer-radius-md);
}
.account-settings__phone {
  display: grid;
  gap: var(--customer-space-3);
}
.account-settings__phone span,
.account-settings__notifications h3 {
  color: var(--customer-text-on-surface);
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
}
.account-settings__phone p {
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-semibold);
}
.account-settings p {
  color: var(--customer-color-text-secondary-on-surface);
  overflow-wrap: anywhere;
}
.account-settings__status,
.account-settings__guest-message {
  line-height: var(--customer-line-height-relaxed);
}
.account-settings .ui-btn {
  justify-self: start;
  padding: 0 var(--customer-space-8);
  border: 1px solid var(--customer-border-subtle-on-surface);
  border-radius: var(--customer-radius-pill);
  font-weight: var(--customer-font-weight-extrabold);
}
.account-settings__primary {
  color: var(--customer-color-black);
  background: var(--customer-primary);
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
  padding-top: var(--customer-space-7);
  border-top: 1px solid var(--customer-border-subtle-on-surface);
}
</style>
