<template>
  <section
    id="notifications"
    ref="sectionRef"
    class="order-notifications"
    aria-labelledby="notifications-title"
    tabindex="-1"
  >
    <div class="order-notifications__copy">
      <h2 id="notifications-title">Уведомления о заказах</h2>
      <p>Сообщим, когда заказ примут и когда он будет готов.</p>
      <p v-if="state === 'inspecting'" role="status">Проверяем уведомления…</p>
      <template v-else-if="state === 'unsupported'">
        <p>Уведомления не поддерживаются этим браузером.</p>
      </template>
      <template v-else-if="state === 'denied'">
        <p>Уведомления заблокированы. Разрешите их в настройках браузера.</p>
      </template>
      <template v-else-if="state === 'failed'">
        <p role="status">
          Не удалось проверить уведомления. Попробуйте ещё раз.
        </p>
      </template>
      <template v-else>
        <p v-if="operation === 'enabling'" role="status">
          Включаем уведомления…
        </p>
        <p v-else-if="operation === 'disabling'" role="status">
          Отключаем уведомления…
        </p>
        <p v-else-if="message" role="status">{{ message }}</p>
        <p v-else-if="subscription !== null">Уведомления включены.</p>
      </template>
    </div>
    <div
      v-if="state === 'denied' || state === 'failed' || state === 'ready'"
      class="order-notifications__actions"
    >
      <ui-btn v-if="state === 'denied'" type="button" @click="inspect"
        >Проверить ещё раз</ui-btn
      >
      <ui-btn v-else-if="state === 'failed'" type="button" @click="inspect"
        >Повторить проверку</ui-btn
      >
      <ui-btn
        v-else-if="subscription === null"
        class="order-notifications__button"
        type="button"
        :loading="operation === 'enabling'"
        @click="enable"
        >Включить уведомления</ui-btn
      >
      <ui-btn
        v-else
        class="order-notifications__button"
        type="button"
        :loading="operation === 'disabling'"
        @click="disable"
        >Отключить уведомления</ui-btn
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref, useTemplateRef } from "vue";

import { useSessionStore } from "@/app/session.store";
import { apiClientKey } from "@/shared/api/client";
import {
  createPushApi,
  type PushSubscriptionRequest,
} from "@/shared/api/push.api";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";

type NotificationState =
  "inspecting" | "unsupported" | "denied" | "ready" | "failed";
type Operation = "enabling" | "disabling" | null;
const inspectionTimeoutMs = 5_000;

const apiClient = inject(apiClientKey);
const sessionStore = useSessionStore();
const sectionRef = useTemplateRef<HTMLElement>("sectionRef");
const state = ref<NotificationState>("inspecting");
const operation = ref<Operation>(null);
const subscription = ref<PushSubscriptionRequest | null>(null);
const message = ref<string | null>(null);

onMounted(() => {
  document.addEventListener("visibilitychange", onVisibilityChange);
  void inspect();
  if (window.location.hash === "#notifications")
    requestAnimationFrame(focusSection);
});
onUnmounted(() =>
  document.removeEventListener("visibilitychange", onVisibilityChange),
);

defineExpose({ focus: focusSection });

function supportsPush(): boolean {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}
function permission(): "default" | "denied" | "granted" | "unsupported" {
  return "Notification" in window
    ? (Notification.permission as "default" | "denied" | "granted")
    : "unsupported";
}
async function inspect(): Promise<void> {
  if (operation.value !== null) return;
  message.value = null;
  subscription.value = null;
  if (!supportsPush()) {
    state.value = "unsupported";
    return;
  }
  if (permission() === "denied") {
    state.value = "denied";
    return;
  }
  state.value = "inspecting";
  try {
    const registration = await getRegistrationForInspection();
    const browserSubscription =
      await registration.pushManager.getSubscription();
    subscription.value =
      browserSubscription === null
        ? null
        : toPushSubscription(browserSubscription);
    state.value = "ready";
  } catch {
    state.value = permission() === "denied" ? "denied" : "failed";
  }
}
async function getRegistrationForInspection(): Promise<ServiceWorkerRegistration> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Push inspection timed out.")),
          inspectionTimeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout !== null) clearTimeout(timeout);
  }
}
async function enable(): Promise<void> {
  if (
    state.value !== "ready" ||
    operation.value !== null ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  )
    return;
  operation.value = "enabling";
  message.value = null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const pushApi = createPushApi(apiClient);
    const publicKey = await pushApi.getPublicKey(sessionStore.accessToken);
    const browserSubscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        applicationServerKey: toApplicationServerKey(publicKey),
        userVisibleOnly: true,
      }));
    const request = toPushSubscription(browserSubscription);
    await pushApi.saveSubscription(sessionStore.accessToken, request);
    subscription.value = request;
  } catch {
    if (permission() === "denied") state.value = "denied";
    else
      message.value =
        "Не удалось изменить настройки уведомлений. Попробуйте ещё раз.";
  } finally {
    operation.value = null;
  }
}
async function disable(): Promise<void> {
  if (
    state.value !== "ready" ||
    subscription.value === null ||
    operation.value !== null ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  )
    return;
  operation.value = "disabling";
  message.value = null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const browserSubscription =
      await registration.pushManager.getSubscription();
    await createPushApi(apiClient).deleteSubscription(
      sessionStore.accessToken,
      subscription.value,
    );
    if (browserSubscription !== null) await browserSubscription.unsubscribe();
    subscription.value = null;
    message.value = "Уведомления отключены.";
  } catch {
    message.value =
      "Не удалось изменить настройки уведомлений. Попробуйте ещё раз.";
  } finally {
    operation.value = null;
  }
}
function onVisibilityChange(): void {
  if (!document.hidden) void inspect();
}
function focusSection(): void {
  sectionRef.value?.scrollIntoView({ block: "start" });
  sectionRef.value?.focus({ preventScroll: true });
}
function toPushSubscription(value: PushSubscription): PushSubscriptionRequest {
  const p256dh = value.getKey("p256dh");
  const auth = value.getKey("auth");
  if (p256dh === null || auth === null)
    throw new Error("Push subscription has no keys.");
  return {
    endpoint: value.endpoint,
    keys: { auth: toBase64(auth), p256dh: toBase64(p256dh) },
  };
}
function toApplicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const key = new Uint8Array(new ArrayBuffer(bytes.length));
  for (const [index, character] of Array.from(bytes).entries())
    key[index] = character.charCodeAt(0);
  return key;
}
function toBase64(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value)));
}
</script>

<style scoped lang="scss">
.order-notifications {
  display: flex;
  flex-direction: column;
  gap: var(--customer-space-7);
  margin: 0 var(--customer-space-9) var(--customer-space-9);
  padding: var(--customer-space-9) var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-lg);
  box-shadow: var(--customer-shadow-card);
}
.order-notifications:focus-visible {
  outline: 2px solid var(--customer-focus-ring);
  outline-offset: 2px;
}
.order-notifications__copy {
  display: grid;
  gap: var(--customer-space-3);
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
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
  overflow-wrap: anywhere;
}
.order-notifications__button,
.order-notifications__actions .ui-btn {
  justify-self: start;
  padding: 0 var(--customer-space-8);
  color: var(--customer-primary);
  background: var(--customer-surface);
  border: 1px solid var(--customer-border-subtle-on-surface);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-extrabold);
}
@media (min-width: 1024px) {
  .order-notifications {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--customer-space-9);
    margin-right: 0;
    margin-left: 0;
  }
  .order-notifications__copy {
    flex: 1;
    min-width: 0;
  }
  .order-notifications__actions {
    flex: 0 0 auto;
  }
}
</style>
