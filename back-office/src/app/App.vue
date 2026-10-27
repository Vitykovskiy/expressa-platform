<template>
  <VApp>
    <AppContent
      v-if="staffSession !== null"
      :key="sessionKey"
      :session="staffSession"
      :notification-order="notificationOrder"
      :notification-message="notificationMessage"
      :navigation-busy="navigationBusy"
      @open-notification="openNotification"
      @logout="logout"
      @session-expired="expireStaffSession"
    />
    <KeepAlive :max="1">
      <AuthPage
        v-if="staffSession === null"
        :restoring="restoring"
        @authenticated="message = ''"
        @error="showError"
      />
    </KeepAlive>
    <div v-if="message" class="app-toast">
      <SourceToast type="error" :message="message" />
    </div>
    <div v-if="backgroundNotice" class="background-notice" role="status">
      <span>{{ backgroundNotice.message }}</span>
      <RouterLink
        v-slot="{ href, navigate }"
        :to="backgroundNotice.href"
        custom
      >
        <a :href="href" @click="navigate">Открыть раздел</a>
      </RouterLink>
    </div>
  </VApp>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, shallowRef, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import {
  currentIntentWorker,
  parseNativeOrderIntent,
  parseNativeViewChallenge,
  requestNativeIntent,
} from "../modules/notifications/native-intent";
import type { NativeOrderIntent } from "../modules/notifications/native-intent.types";
import type { AppNotice, NativeIntentBinding } from "./App.types";
import type { LogoutProofSupplier } from "../modules/session/session.types";
import { useSessionStore } from "../modules/session/session.store";
import AuthPage from "../modules/auth/AuthPage.vue";
import SourceToast from "../shared/ui/SourceToast/SourceToast.vue";
import AppContent from "./AppContent.vue";
import { APP_MESSAGES } from "./App.constants";
import { useApplicationDomains } from "./useApplicationDomains";

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const navigationQuery = computed(() => {
  const query = { ...route.query };

  delete query.section;

  return query;
});
const restoring = shallowRef(true);
const message = shallowRef("");
const notificationIntent = shallowRef<NativeOrderIntent | null>(null);
const notificationMessage = shallowRef("");
const domains = useApplicationDomains(expireStaffSession);
let intentBinding: NativeIntentBinding | null = null;
let bindingEpoch = 0;
let receptionEpoch = 0;
let disposed = false;

const staffSession = computed(() =>
  session.state.kind === "staff" ? session.state.session : null,
);

const sessionKey = computed(() => {
  const current = staffSession.value;

  if (current === null) {
    return "";
  }

  // Тот же ключ отзывает native lifetime и уничтожает сохранённые страницы workspace.
  return `${current.identity.id}:${current.identity.employee.role}:${current.accessToken}`;
});

const notificationOrder = computed(
  () => notificationIntent.value?.orderId ?? null,
);

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

const backgroundNotice = computed(() => {
  if (session.state.kind !== "staff") {
    return null;
  }

  const section = route.name;
  const notices: readonly AppNotice[] = [
    { section: "orders", message: domains.orders.message },
    { section: "users", message: domains.users.notice ?? "" },
    { section: "settings", message: domains.settings.message },
    {
      section: "catalog",
      message:
        domains.catalog.command?.phase === "unknown"
          ? APP_MESSAGES.catalogOutcomeUnknown
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

  return {
    message: notice.message,
    href: {
      name: notice.section,
      query: navigationQuery.value,
      hash: route.hash,
    },
  };
});

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

  if (worker === null) {
    return;
  }

  if (epoch !== bindingEpoch || sessionKey.value !== ownerKey || disposed) {
    return;
  }

  const lifetime = globalThis.crypto.randomUUID();
  const accepted = await requestNativeIntent(worker, "claim", lifetime);

  if (!accepted) {
    return;
  }

  if (epoch !== bindingEpoch || sessionKey.value !== ownerKey || disposed) {
    return;
  }

  intentBinding = { ownerKey, lifetime, worker };
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
    await respondToNativeChallenge(binding, challenge, event.ports[0]);

    return;
  }

  const candidate = parseNativeOrderIntent(event.data);

  if (
    candidate === null ||
    candidate.lifetime !== binding.lifetime ||
    candidate.id === notificationIntent.value?.id
  ) {
    return;
  }

  await inspectNotificationIntent(binding, candidate);
}

async function respondToNativeChallenge(
  binding: NativeIntentBinding,
  challenge: string,
  port: globalThis.MessagePort | undefined,
) {
  const worker = await currentIntentWorker();

  if (
    port !== undefined &&
    worker === binding.worker &&
    isCurrentIntentBinding(binding)
  ) {
    port.postMessage({
      type: "expressa-view-response",
      challenge,
      lifetime: binding.lifetime,
    });
  }

  port?.close();
}

async function inspectNotificationIntent(
  binding: NativeIntentBinding,
  candidate: NativeOrderIntent,
) {
  const epoch = ++receptionEpoch;
  const current = await requestNativeIntent(
    binding.worker,
    "inspect",
    binding.lifetime,
    candidate,
  );

  if (!current) {
    return;
  }

  // Более новый клик или смена staff/worker отзывают ожидающий inspect.
  if (epoch !== receptionEpoch || !isCurrentIntentBinding(binding)) {
    return;
  }

  if (candidate.expiresAt <= Date.now()) {
    return;
  }

  notificationMessage.value =
    notificationIntent.value !== null &&
    notificationIntent.value.orderId !== candidate.orderId
      ? APP_MESSAGES.notificationReplaced
      : APP_MESSAGES.notificationSelected;
  notificationIntent.value = candidate;
}

function isCurrentIntentBinding(binding: NativeIntentBinding): boolean {
  return intentBinding === binding && binding.ownerKey === sessionKey.value;
}

async function openNotification() {
  const intent = notificationIntent.value;
  const binding = intentBinding;

  if (intent === null || binding === null) {
    return;
  }

  if (navigationBusy.value || binding.ownerKey !== sessionKey.value) {
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
    showError(APP_MESSAGES.notificationExpired);

    return;
  }

  try {
    await router.push({
      name: "orders",
      query: { ...navigationQuery.value, order: intent.orderId },
      hash: route.hash,
    });
  } catch {
    showError(APP_MESSAGES.navigationFailure);
  }
}

function expireStaffSession() {
  session.invalidate();
  showError(APP_MESSAGES.sessionExpired);
}

async function logout() {
  // Переход session в pending очищает domains; proof фиксируется до logout.
  const supplier = captureLogoutProofSupplier();
  const ended = await session.logout(supplier);

  if (!ended && !disposed) {
    showError(APP_MESSAGES.logoutUnconfirmed);
  }
}

function captureLogoutProofSupplier(): LogoutProofSupplier | undefined {
  const current = session.state;

  if (current.kind !== "staff") {
    return undefined;
  }

  if (current.session.identity.employee.role !== "barista") {
    return undefined;
  }

  return domains.notifications.logoutProofSupplier({
    identityId: current.session.identity.id,
    accessToken: current.session.accessToken,
  });
}

function showError(value: string) {
  message.value = value;
}

async function restoreSession() {
  const outcome = await session.restore();

  if (disposed) {
    return;
  }

  restoring.value = false;

  if (outcome.kind === "uncertain" || outcome.kind === "unavailable") {
    showError(APP_MESSAGES.restoreFailure);
  }
}

watch(
  () => session.state.kind,
  (kind) => {
    message.value = "";

    if (kind !== "staff") {
      notificationIntent.value = null;
      globalThis.document.title = "Expressa Admin";
    }
  },
  { flush: "sync" },
);

watch(sessionKey, bindNativeIntent, { flush: "sync" });
const removeNavigationError = router.onError(() =>
  showError(APP_MESSAGES.navigationFailure),
);
const removeNavigationComplete = router.afterEach((_to, _from, failure) => {
  if (!failure) {
    message.value = "";
  }
});

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

onMounted(restoreSession);

onScopeDispose(() => {
  disposed = true;
  void bindNativeIntent();
  removeNavigationError();
  removeNavigationComplete();

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
