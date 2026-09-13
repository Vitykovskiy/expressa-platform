<template>
  <VApp>
    <main
      v-if="sessionBoundaryState !== 'ready'"
      aria-live="polite"
      class="session-boundary"
      role="status"
      :aria-busy="sessionBoundaryState === 'loading'"
    >
      <div class="session-boundary__content">
        <p v-if="sessionBoundaryState === 'loading'">Восстанавливаем сессию…</p>
        <template v-else>
          <p>{{ sessionStore.errorMessage }}</p>
          <button type="button" @click="retrySession">Повторить</button>
        </template>
      </div>
    </main>
    <CustomerShell
      v-else
      :active-destination="activeDestination"
      :account-label="accountLabel"
      :cart-count="cartStore.itemCount"
      :categories="menuStore.menu?.categories ?? []"
      :is-authenticated="sessionStore.status === 'authenticated'"
      :is-logout-pending="logoutPending"
      :selected-category-id="selectedCategoryId"
      @navigate="navigate"
      @select-category="selectCategory"
      @open-account="openAccount"
      @sign-out="logout"
    >
      <ErrorNotice
        :error="appStore.screenError"
        @close="appStore.clearScreenError"
      />
      <RouterView v-slot="{ Component, route: routedRoute }">
        <component
          :is="Component"
          v-if="routedRoute.path === appRoute.home"
          :menu-shell-command="pendingMenuShellCommand"
          :menu-screen="observedMenuScreen"
          @menu-screen-change="handleMenuScreenChange"
          @menu-shell-command-ack="handleMenuShellCommandAck"
        />
        <component :is="Component" v-else />
      </RouterView>
    </CustomerShell>
    <AccountSettingsDialog
      v-model="accountSettingsOpen"
      :account-label="accountLabel"
      :account-id="sessionStore.currentUser?.id ?? null"
      :authenticated="sessionStore.status === 'authenticated'"
      :logout-error="logoutError"
      :logout-pending="logoutPending"
      :return-focus-to="accountSettingsTrigger"
      @sign-in="navigate('auth')"
      @sign-out="logout"
    />
  </VApp>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref, watch } from "vue";
import { VApp } from "vuetify/components";
import { RouterView, useRoute, useRouter } from "vue-router";

import ErrorNotice from "../shared/ui/ErrorNotice.vue";
import AccountSettingsDialog from "@/features/account/AccountSettingsDialog.vue";
import { configureOrderNotificationsDependencies } from "@/entities/customer/model/order-notifications.store.dependencies";
import { useOrderNotificationsStore } from "@/entities/customer/model/order-notifications.store";
import { getSafeAuthReturnTo } from "@/shared/lib/auth-return";
import { apiClientKey } from "@/shared/api/client";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import CustomerShell from "@/widgets/customer-shell/CustomerShell.vue";
import type { ShellNavigationDestination } from "@/widgets/customer-shell/ShellNavigation.types";
import type {
  MenuFlowScreen,
  MenuShellCommand,
  MenuShellTarget,
} from "@/features/menu/MenuFlow.types";

import { useAppStore } from "./app.store";
import { appRoute } from "./App.constants";
import { routePaths } from "./router.constants";
import type { AppBootstrapState, SessionBoundaryState } from "./App.types";
import { useSessionStore } from "./session.store";

const appStore = useAppStore();
const cartStore = useCartStore();
const menuStore = useMenuStore();
const sessionStore = useSessionStore();
const notificationStore = useOrderNotificationsStore();
const apiClient = inject(apiClientKey);
const route = useRoute();
const router = useRouter();
const bootstrapState = reactive<AppBootstrapState>({ ready: false });
const pendingMenuShellCommand = ref<MenuShellCommand | null>(null);
const observedMenuScreen = ref<MenuFlowScreen>({ id: "root" });
const logoutPending = ref(false);
const sessionRetrying = ref(false);
const accountSettingsOpen = ref(false);
const accountSettingsTrigger = ref<HTMLElement | null>(null);
const logoutError = ref<string | null>(null);
let nextMenuShellCommandId = 0;
const activeDestination = computed<ShellNavigationDestination>(() => {
  if (route.path === "/cart") return "cart";
  if (
    route.path === routePaths.authPhone ||
    route.path === routePaths.authCode
  ) {
    const path = getInternalAuthReturnPath(route.query.returnTo);
    if (path !== undefined) {
      if (path === "/cart") return "cart";
      if (path === "/orders" || path.startsWith("/orders/")) return "orders";
    }
    return "auth";
  }
  if (route.path === "/orders" || route.path.startsWith("/orders/"))
    return "orders";
  return "menu";
});
const accountLabel = computed(
  () => sessionStore.currentUser?.phoneE164 ?? sessionStore.phone ?? "",
);
const selectedCategoryId = computed(() => {
  if (route.path !== appRoute.home || observedMenuScreen.value.id === "root")
    return undefined;
  return observedMenuScreen.value.categoryId;
});
const sessionBoundaryState = computed<SessionBoundaryState>(() => {
  if (!bootstrapState.ready || sessionRetrying.value) return "loading";
  if (sessionStore.status !== "unknown") return "ready";

  return sessionStore.errorMessage === null ? "ready" : "error";
});

watch(
  () => route.path,
  (path) => {
    if (path !== appRoute.home) {
      pendingMenuShellCommand.value = null;
      observedMenuScreen.value = { id: "root" };
    }
  },
);

watch(
  () => sessionStore.status,
  async (status) => {
    if (status !== "anonymous" || !route.meta.requiresCustomer) return;
    await router.replace({
      path: routePaths.authPhone,
      query: { returnTo: route.fullPath },
    });
  },
);

onMounted(async () => {
  if (apiClient !== undefined)
    configureOrderNotificationsDependencies(apiClient, (read) =>
      sessionStore.readProtected(read),
    );
  cartStore.restore();
  await sessionStore.bootstrap();
  notificationStore.setSession(
    sessionStore.currentUser?.id ?? null,
    sessionStore.accessToken,
  );
  bootstrapState.ready = true;
});

watch(
  () =>
    [sessionStore.currentUser?.id ?? null, sessionStore.accessToken] as const,
  ([accountId, accessToken]) =>
    notificationStore.setSession(accountId, accessToken),
);

async function logout(): Promise<void> {
  if (logoutPending.value) return;

  logoutPending.value = true;
  logoutError.value = null;
  try {
    await sessionStore.logout();
    await router.replace(appRoute.home);
  } catch {
    logoutError.value = "Не удалось выйти из аккаунта. Попробуйте ещё раз.";
  } finally {
    logoutPending.value = false;
  }
}

function openAccount(): void {
  accountSettingsTrigger.value =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  accountSettingsOpen.value = true;
}

async function retrySession(): Promise<void> {
  sessionRetrying.value = true;
  try {
    await sessionStore.bootstrap();

    if (sessionStore.status === "anonymous" && route.meta.requiresCustomer) {
      await router.replace({
        path: routePaths.authPhone,
        query: { returnTo: route.fullPath },
      });
    }
  } finally {
    sessionRetrying.value = false;
  }
}

async function navigate(
  destination: ShellNavigationDestination,
): Promise<void> {
  if (destination === "menu") {
    if (route.path === appRoute.home) {
      issueMenuShellCommand({ id: "root" });
      return;
    }
    await router.push(appRoute.home);
    return;
  }

  if (destination === "cart") {
    await router.push("/cart");
    return;
  }

  if (destination === "orders") {
    await router.push("/orders");
    return;
  }

  const returnTo = getAuthReturnTo();
  await router.push({
    path: routePaths.authPhone,
    query: returnTo === undefined ? {} : { returnTo },
  });
}

function selectCategory(categoryId: string): void {
  if (route.path === appRoute.home) {
    issueMenuShellCommand({ id: "category", categoryId });
    return;
  }

  void router.push(appRoute.home).then(() => {
    if (route.path === appRoute.home) {
      issueMenuShellCommand({ id: "category", categoryId });
    }
  });
}

function issueMenuShellCommand(target: MenuShellTarget): void {
  nextMenuShellCommandId += 1;
  pendingMenuShellCommand.value = {
    requestId: nextMenuShellCommandId,
    target,
  };
}

function handleMenuScreenChange(screen: MenuFlowScreen): void {
  if (route.path === appRoute.home) observedMenuScreen.value = screen;
}

function handleMenuShellCommandAck(requestId: number): void {
  if (
    route.path === appRoute.home &&
    pendingMenuShellCommand.value?.requestId === requestId
  ) {
    pendingMenuShellCommand.value = null;
  }
}

function getAuthReturnTo(): string | undefined {
  if (route.path === routePaths.authPhone || route.path === routePaths.authCode)
    return undefined;
  return route.fullPath;
}

function getInternalAuthReturnPath(value: unknown): string | undefined {
  return getSafeAuthReturnTo(value);
}
</script>

<style scoped>
.session-boundary {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  padding: var(--customer-space-8);
  color: var(--customer-text);
  background: var(--customer-background);
}

.session-boundary__content {
  display: grid;
  gap: var(--customer-space-6);
  max-width: 32rem;
  text-align: center;
}

.session-boundary__content p {
  margin: 0;
}

.session-boundary__content button {
  min-height: 44px;
  padding: 0 var(--customer-space-8);
  color: var(--customer-text);
  background: var(--customer-primary);
  border: 0;
  border-radius: var(--customer-radius-sm);
  font: inherit;
  font-weight: var(--customer-font-weight-extrabold);
}
</style>
