<template>
  <VApp>
    <CustomerShell
      v-if="bootstrapState.ready"
      :active-destination="activeDestination"
      :account-label="accountLabel"
      :cart-count="cartStore.itemCount"
      :categories="menuStore.menu?.categories ?? []"
      :is-authenticated="sessionStore.status === 'authenticated'"
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
import type { AppBootstrapState } from "./App.types";
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
let nextMenuShellCommandId = 0;
const activeDestination = computed<ShellNavigationDestination>(() => {
  if (route.path === "/cart") return "cart";
  if (route.path === routePaths.authPhone || route.path === routePaths.authCode)
    return "auth";
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
  try {
    await sessionStore.logout();
    await router.replace(appRoute.home);
  } catch {
    /* state owns error */
  }
}

function back(): void {
  if (route.path === appRoute.home && observedMenuScreen.value.id !== "root") {
    history.back();
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
  return activeDestination.value === "auth" ? undefined : route.fullPath;
}
</script>
