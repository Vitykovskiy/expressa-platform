<template>
  <section
    v-if="visible"
    ref="section"
    class="order-notifications"
    aria-labelledby="notifications-title"
  >
    <div>
      <h2 id="notifications-title">Уведомления о заказах</h2>
      <p>{{ orderNotificationsInvitationMessage }}</p>
      <p class="order-notifications__disclosure">
        Уведомления будут приходить на это устройство и после выхода из
        аккаунта. На общем устройстве их смогут увидеть другие люди.
      </p>
      <p v-if="notifications.operation !== null" role="status">
        Включаем уведомления…
      </p>
      <p v-else-if="failed" role="status">
        Не удалось включить уведомления. Попробуйте ещё раз.
      </p>
    </div>
    <div class="order-notifications__actions">
      <ui-btn
        class="order-notifications__primary"
        type="button"
        :loading="notifications.operation !== null"
        @click="enable"
        >Включить уведомления</ui-btn
      >
      <ui-btn
        type="button"
        :disabled="notifications.operation !== null"
        @click="dismiss"
        >Не сейчас</ui-btn
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

import {
  hasNotificationInvitationChoice,
  rememberNotificationInvitationChoice,
} from "@/entities/customer/model/notification-invitation";
import { useOrderNotificationsStore } from "@/entities/customer/model/order-notifications.store";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import { orderNotificationsInvitationMessage } from "./OrderNotificationsSection.constants";
import type { OrderNotificationsSectionProps } from "./OrderNotificationsSection.types";

const props = defineProps<OrderNotificationsSectionProps>();
const notifications = useOrderNotificationsStore();
const section = ref<HTMLElement | null>(null);
const dismissed = ref(false);
const exposureRecordedThisVisit = ref(false);
const storageUnavailable = ref(false);
let observer: IntersectionObserver | null = null;
let observationGeneration = 0;
let observationDisposed = false;

const failed = computed(() => notifications.state === "failed_enable");
const visible = computed(
  () =>
    props.eligible &&
    props.accountId !== null &&
    !dismissed.value &&
    !storageUnavailable.value &&
    (notifications.state === "off_current" || failed.value) &&
    (!hasNotificationInvitationChoice(props.accountId) ||
      exposureRecordedThisVisit.value),
);

onMounted(() => {
  void notifications.inspect();
  void observeExposure();
});
onBeforeUnmount(() => {
  observationDisposed = true;
  observationGeneration += 1;
  observer?.disconnect();
});
watch(visible, (isVisible) => {
  if (isVisible) void observeExposure();
  else {
    observationGeneration += 1;
    observer?.disconnect();
  }
});
watch(
  () => props.accountId,
  () => {
    observationGeneration += 1;
    observer?.disconnect();
    dismissed.value = false;
    exposureRecordedThisVisit.value = false;
    storageUnavailable.value = false;
    void observeExposure();
  },
);

async function observeExposure(): Promise<void> {
  const accountId = props.accountId;
  const generation = observationGeneration;
  await nextTick();
  if (
    observationDisposed ||
    generation !== observationGeneration ||
    accountId !== props.accountId
  )
    return;
  observer?.disconnect();
  const target = section.value;
  if (target === null || accountId === null) return;
  observer = new IntersectionObserver((entries) => {
    if (
      observationDisposed ||
      generation !== observationGeneration ||
      accountId !== props.accountId ||
      target !== section.value ||
      !visible.value
    )
      return;
    if (
      document.hidden ||
      !entries.some((entry) => entry.target === target && entry.isIntersecting)
    )
      return;
    if (exposureRecordedThisVisit.value) return;
    if (!rememberNotificationInvitationChoice(accountId)) {
      storageUnavailable.value = true;
      observer?.disconnect();
      return;
    }
    exposureRecordedThisVisit.value = true;
    observer?.disconnect();
  });
  observer.observe(target);
}

async function enable(): Promise<void> {
  exposureRecordedThisVisit.value = true;
  rememberChoice();
  await notifications.enable();
}

function dismiss(): void {
  const wasFocused = section.value?.contains(document.activeElement) ?? false;
  rememberChoice();
  dismissed.value = true;
  if (wasFocused) props.returnFocusTo?.focus();
}

function rememberChoice(): void {
  if (props.accountId !== null)
    rememberNotificationInvitationChoice(props.accountId);
}
</script>

<style scoped lang="scss">
.order-notifications {
  display: grid;
  gap: var(--customer-space-7);
  margin-top: var(--customer-space-10);
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
  box-shadow: var(--customer-shadow-card);
}
.order-notifications h2,
.order-notifications p {
  margin: 0;
}
.order-notifications h2 {
  font-size: var(--customer-font-size-md);
  font-weight: var(--customer-font-weight-extrabold);
}
.order-notifications p {
  color: var(--customer-color-text-secondary-on-surface);
  overflow-wrap: anywhere;
}
.order-notifications__disclosure {
  margin-top: var(--customer-space-4) !important;
  font-size: var(--customer-font-size-sm);
}
.order-notifications__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--customer-space-4);
}
.order-notifications .ui-btn {
  padding: 0 var(--customer-space-8);
  border: 1px solid var(--customer-border-subtle-on-surface);
  border-radius: var(--customer-radius-pill);
  font-weight: var(--customer-font-weight-extrabold);
}
.order-notifications__primary {
  color: var(--customer-background);
  background: var(--customer-primary);
}
</style>
