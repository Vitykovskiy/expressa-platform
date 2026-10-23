<template>
  <VApp>
    <StaffWorkspace
      v-if="session.state.kind === 'staff'"
      :key="`${session.state.session.identity.id}:${session.state.session.identity.role}:${session.state.session.accessToken}`"
      :session="session.state.session"
      :intent="intent"
      :search="search"
      :notification-order="notificationOrder"
      :notification-message="notificationMessage"
      :navigation-busy="navigationBusy"
      @open-notification="openNotification"
      @navigate="navigate"
      @logout="logout"
      @session-expired="expireStaffSession"
    />
    <KeepAlive :max="1">
      <AuthPage
        v-if="session.state.kind !== 'staff'"
        :restoring="restoring"
        :staff-handoff="false"
        @authenticated="message = ''"
        @error="showError"
      />
    </KeepAlive>
    <div v-if="message" class="app-toast">
      <SourceToast type="error" :message="message" />
    </div>
    <div v-if="backgroundNotice" class="background-notice" role="status">
      <span>{{ backgroundNotice.message }}</span>
      <a
        :href="backgroundNotice.href"
        @click="navigateLink($event, backgroundNotice.href)"
        >Открыть раздел</a
      >
    </div>
  </VApp>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, shallowRef, watch } from "vue";
import {
  currentIntentWorker,
  parseNativeOrderIntent,
  parseNativeViewChallenge,
  requestNativeIntent,
} from "../entities/notifications/native-intent";
import type { NativeOrderIntent } from "../entities/notifications/native-intent.types";
import type { NativeIntentBinding } from "./App.types";
import { useSessionStore } from "../entities/session/session.store";
import AuthPage from "../pages/auth/AuthPage.vue";
import SourceToast from "../shared/ui/SourceToast/SourceToast.vue";
import StaffWorkspace from "./StaffWorkspace.vue";
import { APP_MESSAGES } from "./App.constants";
import { useSectionIntent } from "./navigation";
import { useStaffDomains } from "./useStaffDomains";

const session = useSessionStore();
const intent = useSectionIntent();
const search = shallowRef(globalThis.window.location.search);
const restoring = shallowRef(true);
const message = shallowRef("");
const notificationIntent = shallowRef<NativeOrderIntent | null>(null);
const notificationOrder = computed(
  () => notificationIntent.value?.orderId ?? null,
);
const sessionKey = computed(() =>
  session.state.kind === "staff"
    ? `${session.state.session.identity.id}:${session.state.session.identity.role}:${session.state.session.accessToken}`
    : "",
);
let intentBinding: NativeIntentBinding | null = null;
let bindingEpoch = 0;
let receptionEpoch = 0;
const notificationMessage = shallowRef("");
const domains = useStaffDomains(expireStaffSession);
let disposed = false;

const navigationBusy = computed(
  () =>
    domains.orders.command !== null ||
    domains.orders.dialog !== null ||
    domains.catalog.command !== null ||
    domains.users.busy ||
    domains.users.dialog !== null ||
    domains.settings.command !== null ||
    domains.availability.command !== null,
);

async function bindNativeIntent() {
  const epoch = ++bindingEpoch;
  const previous = intentBinding;

  intentBinding = null;
  notificationIntent.value = null;
  receptionEpoch++;
  if (previous !== null) {
    void requestNativeIntent(previous.worker, "release", previous.lifetime);
  }

  const ownerKey = sessionKey.value;

  if (!ownerKey || disposed) {
    return;
  }

  const worker = await currentIntentWorker();

  if (
    worker === null ||
    epoch !== bindingEpoch ||
    sessionKey.value !== ownerKey ||
    disposed
  ) {
    return;
  }

  const lifetime = globalThis.crypto.randomUUID();
  const accepted = await requestNativeIntent(worker, "claim", lifetime);

  if (
    accepted &&
    epoch === bindingEpoch &&
    sessionKey.value === ownerKey &&
    !disposed
  ) {
    intentBinding = { ownerKey, lifetime, worker };
  }
}

async function receiveNotification(event: globalThis.MessageEvent<unknown>) {
  const binding = intentBinding;

  if (
    binding === null ||
    event.origin !== globalThis.location.origin ||
    event.source !== binding.worker ||
    globalThis.navigator.serviceWorker.controller !== binding.worker ||
    binding.ownerKey !== sessionKey.value
  ) {
    return;
  }

  const challenge = parseNativeViewChallenge(event.data);

  if (challenge !== null) {
    const port = event.ports[0];
    const worker = await currentIntentWorker();

    if (
      port !== undefined &&
      worker === binding.worker &&
      intentBinding === binding &&
      binding.ownerKey === sessionKey.value
    ) {
      port.postMessage({
        type: "expressa-view-response",
        challenge,
        lifetime: binding.lifetime,
      });
    }

    port?.close();

    return;
  }

  const intent = parseNativeOrderIntent(event.data);

  if (
    intent === null ||
    intent.lifetime !== binding.lifetime ||
    intent.id === notificationIntent.value?.id
  ) {
    return;
  }

  const epoch = ++receptionEpoch;
  const current = await requestNativeIntent(
    binding.worker,
    "inspect",
    binding.lifetime,
    intent,
  );

  if (
    !current ||
    epoch !== receptionEpoch ||
    intentBinding !== binding ||
    binding.ownerKey !== sessionKey.value ||
    intent.expiresAt <= Date.now()
  ) {
    return;
  }

  notificationMessage.value =
    notificationIntent.value !== null &&
    notificationIntent.value.orderId !== intent.orderId
      ? "Выбран другой заказ из уведомления."
      : "Выбран заказ из уведомления.";
  notificationIntent.value = intent;
}

async function openNotification() {
  const intent = notificationIntent.value;
  const binding = intentBinding;

  if (
    intent === null ||
    binding === null ||
    navigationBusy.value ||
    binding.ownerKey !== sessionKey.value
  ) {
    return;
  }

  const accepted = await requestNativeIntent(
    binding.worker,
    "consume",
    binding.lifetime,
    intent,
  );

  if (
    intentBinding !== binding ||
    notificationIntent.value !== intent ||
    binding.ownerKey !== sessionKey.value
  ) {
    return;
  }

  notificationIntent.value = null;
  if (!accepted || navigationBusy.value) {
    showError("Ссылка на заказ устарела. Откройте заказ в списке.");

    return;
  }

  const url = new globalThis.URL(globalThis.window.location.href);

  url.searchParams.delete("section");
  url.searchParams.set("order", intent.orderId);
  navigate(`${url.pathname}${url.search}${url.hash}`);
}

const backgroundNotice = computed(() => {
  if (session.state.kind !== "staff") {
    return null;
  }

  const section = intent.value.kind === "valid" ? intent.value.section : null;
  const notices = [
    { section: "orders", message: domains.orders.message },
    { section: "users", message: domains.users.notice ?? "" },
    { section: "settings", message: domains.settings.message },
    {
      section: "catalog",
      message:
        domains.catalog.command?.phase === "unknown"
          ? "Результат изменения меню неизвестен. Проверьте исходную задачу."
          : "",
    },
    { section: "availability", message: domains.availability.message },
  ];
  const notice = notices.find(
    (item) =>
      item.section !== section &&
      typeof item.message === "string" &&
      item.message.length > 0,
  );

  if (!notice) {
    return null;
  }

  const url = new globalThis.URL(globalThis.window.location.href);

  url.searchParams.set("section", notice.section);

  return {
    message: notice.message,
    href: `${url.pathname}${url.search}${url.hash}`,
  };
});

function syncSearch() {
  search.value = globalThis.window.location.search;
}

function navigate(href: string) {
  const url = new globalThis.URL(href, globalThis.window.location.href);

  if (url.origin !== globalThis.window.location.origin) {
    return;
  }

  globalThis.window.history.pushState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
  globalThis.window.dispatchEvent(new globalThis.PopStateEvent("popstate"));
  message.value = "";
}

function navigateLink(event: globalThis.MouseEvent, href: string) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return;
  }

  event.preventDefault();
  navigate(href);
}

function expireStaffSession() {
  session.invalidate();
  showError(APP_MESSAGES.sessionExpired);
}

async function logout() {
  const current = session.state;
  const supplier =
    current.kind === "staff" && current.session.identity.role === "barista"
      ? domains.notifications.logoutProofSupplier({
          identityId: current.session.identity.id,
          accessToken: current.session.accessToken,
        })
      : undefined;
  const ended = await session.logout(supplier);

  if (!ended && !disposed) {
    showError(APP_MESSAGES.logoutUnconfirmed);
  }
}

function showError(value: string) {
  message.value = value;
}

watch(
  () => session.state.kind,
  (kind) => {
    message.value = "";
    if (kind !== "staff") {
      notificationIntent.value = null;
    }

    if (kind !== "staff") {
      globalThis.document.title = "Expressa Admin";
    }
  },
  { flush: "sync" },
);

watch(sessionKey, bindNativeIntent, { flush: "sync" });
globalThis.window.addEventListener("popstate", syncSearch);
if ("serviceWorker" in globalThis.navigator) {
  globalThis.navigator.serviceWorker.addEventListener(
    "message",
    receiveNotification,
  );
  globalThis.navigator.serviceWorker.addEventListener(
    "controllerchange",
    bindNativeIntent,
  );
}

onMounted(async () => {
  const outcome = await session.restore();

  if (disposed) {
    return;
  }

  restoring.value = false;
  if (outcome.kind === "uncertain" || outcome.kind === "unavailable") {
    showError(APP_MESSAGES.restoreFailure);
  }
});
onScopeDispose(() => {
  disposed = true;
  void bindNativeIntent();
  globalThis.window.removeEventListener("popstate", syncSearch);
  if ("serviceWorker" in globalThis.navigator) {
    globalThis.navigator.serviceWorker.removeEventListener(
      "controllerchange",
      bindNativeIntent,
    );
    globalThis.navigator.serviceWorker.removeEventListener(
      "message",
      receiveNotification,
    );
  }

  session.invalidate();
});
</script>

<style scoped>
.app-toast {
  position: fixed;
  z-index: 10;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
}
.background-notice {
  position: fixed;
  z-index: 9;
  left: 236px;
  right: 16px;
  bottom: 16px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  font-size: 13px;
  line-height: 19.5px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 767px) {
  .app-toast {
    top: 16px;
  }
  .background-notice {
    left: 16px;
    bottom: 76px;
  }
}
</style>
