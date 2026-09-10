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
      :show-back="showBack"
      @back="back"
      @navigate="navigate"
      @select-category="selectCategory"
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
          @menu-screen-change="handleMenuScreenChange"
          @menu-shell-command-ack="handleMenuShellCommandAck"
        />
        <component :is="Component" v-else />
      </RouterView>
    </CustomerShell>
  </VApp>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { VApp } from "vuetify/components";
import { RouterView, useRoute, useRouter } from "vue-router";

import ErrorNotice from "../shared/ui/ErrorNotice.vue";
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
const route = useRoute();
const router = useRouter();
const bootstrapState = reactive<AppBootstrapState>({ ready: false });
const pendingMenuShellCommand = ref<MenuShellCommand | null>(null);
const observedMenuScreen = ref<MenuFlowScreen>({ id: "root" });
const logoutPending = ref(false);
const sessionRetrying = ref(false);
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
const showBack = computed(
  () =>
    route.path.startsWith("/orders/") ||
    (route.path === appRoute.home && observedMenuScreen.value.id !== "root"),
);
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

onMounted(async () => {
  cartStore.restore();
  await sessionStore.bootstrap();
  bootstrapState.ready = true;
});

async function logout(): Promise<void> {
  if (logoutPending.value) return;

  logoutPending.value = true;
  try {
    await sessionStore.logout();
    await router.replace(appRoute.home);
  } catch {
    /* state owns error */
  } finally {
    logoutPending.value = false;
  }
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

function back(): void {
  if (route.path === appRoute.home) {
    const screen = observedMenuScreen.value;
    if (screen.id === "product") {
      issueMenuShellCommand({ id: "category", categoryId: screen.categoryId });
    } else if (screen.id === "category") {
      issueMenuShellCommand({ id: "root" });
    }
    return;
  }

  if (route.path.startsWith("/orders/")) {
    void router.push("/orders");
  }
}

function navigate(destination: ShellNavigationDestination): void {
  if (destination === "menu") {
    if (route.path === appRoute.home) {
      issueMenuShellCommand({ id: "root" });
      return;
    }
    void router.push(appRoute.home);
    return;
  }

  if (destination === "cart") {
    void router.push("/cart");
    return;
  }

  if (destination === "orders") {
    void router.push("/orders");
    return;
  }

  const returnTo = getAuthReturnTo();
  void router.push({
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
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return undefined;
  }

  const path = new URL(value, window.location.origin).pathname;
  return path === routePaths.authPhone || path === routePaths.authCode
    ? undefined
    : path;
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
