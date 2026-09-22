<template>
  <VApp>
    <VMain>
      <div ref="pageRegion" class="app-root">
        <VContainer class="app-content">
          <NotificationHost
            :candidate-entries="notificationEntries"
            :entries="visibleNotificationEntries"
            @dismiss="dismissNotification"
            @origin="captureNotificationOrigin"
            @recover="notificationRuntime.recover"
            @region="registerNotificationRegion"
            @visibility="notificationRuntime.setVisibility"
          />
          <LoadingState
            v-if="
              sessionStore.status === 'unknown' &&
              route.path !== routePaths.login
            "
          />
          <template v-else>
            <AdminShell
              v-if="sessionStore.currentUser !== null"
              :active-section="activeSection"
              :items="navigationItems"
              :role="sessionStore.currentUser.role"
              @logout="logout"
              @navigate="navigate"
            >
              <RouterView />
            </AdminShell>
            <RouterView v-else />
          </template>
        </VContainer>
      </div>
    </VMain>
  </VApp>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { VApp, VContainer, VMain } from "vuetify/components";
import LoadingState from "../pages/admin/auth/LoadingState.vue";

import AdminShell from "../widgets/admin-shell/AdminShell.vue";
import type { AdminSection } from "../shared/ui/admin/Admin.types";
import { adminShellFallbackSection } from "../widgets/admin-shell/AdminShell.constants";
import NotificationHost from "../shared/ui/notifications/NotificationHost.vue";
import {
  notificationRuntimeKey,
  sameNotificationEntries,
} from "./notifications/notification-runtime.types";
import { overlayCoordinatorKey } from "../shared/ui/overlay/overlay-coordinator.types";

import { createNavigationItems } from "./navigation";
import { routePaths } from "./router.constants";
import { useSessionStore } from "./session.store";
import type { AppRoute } from "./App.types";

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const injectedNotificationRuntime = inject(notificationRuntimeKey);
const injectedOverlayCoordinator = inject(overlayCoordinatorKey);
if (
  injectedNotificationRuntime === undefined ||
  injectedOverlayCoordinator === undefined
)
  throw new Error("Notification root is not configured.");
const notificationRuntime = injectedNotificationRuntime;
const overlayCoordinator = injectedOverlayCoordinator;
const notificationEntries = shallowRef(notificationRuntime.entries);
const visibleNotificationEntries = shallowRef(
  notificationRuntime.visibleEntries,
);
const unsubscribeNotifications = notificationRuntime.subscribe(() => {
  const nextEntries = notificationRuntime.entries;
  const nextVisibleEntries = notificationRuntime.visibleEntries;
  if (!sameNotificationEntries(notificationEntries.value, nextEntries))
    notificationEntries.value = nextEntries;
  if (
    !sameNotificationEntries(
      visibleNotificationEntries.value,
      nextVisibleEntries,
    )
  )
    visibleNotificationEntries.value = nextVisibleEntries;
});
let unregisterNotificationRegion: (() => void) | undefined;
let unregisterPageRegion: (() => void) | undefined;
const pageRegion = ref<HTMLElement | null>(null);

const navigationItems = computed(() =>
  createNavigationItems(sessionStore.currentUser?.role ?? null),
);
const activeSection = computed<AdminSection>(() => {
  const routeSection = (route.meta as AppRoute).section;

  return (
    routeSection ??
    navigationItems.value[0]?.section ??
    adminShellFallbackSection
  );
});

async function navigate(section: AdminSection): Promise<void> {
  const item = navigationItems.value.find(
    (candidate) => candidate.section === section,
  );

  if (item !== undefined) await router.push(item.path);
}

async function logout(): Promise<void> {
  await sessionStore.logout();

  if (sessionStore.status === "anonymous")
    await router.replace(routePaths.login);
}

function dismissNotification(id: string): void {
  notificationRuntime.dismiss(id);
  void nextTick(() => overlayCoordinator.restoreFocus(id));
}

function captureNotificationOrigin(
  id: string,
  origin: HTMLElement | null,
): void {
  overlayCoordinator.captureNotificationOrigin(id, origin);
}

function registerNotificationRegion(region: HTMLElement | null): void {
  unregisterNotificationRegion?.();
  unregisterNotificationRegion =
    region === null
      ? undefined
      : overlayCoordinator.registerNotificationRegion(region);
}

onBeforeUnmount(() => {
  unsubscribeNotifications();
  unregisterNotificationRegion?.();
  unregisterPageRegion?.();
});

onMounted(() => {
  if (pageRegion.value !== null)
    unregisterPageRegion = overlayCoordinator.registerPageRegion(
      pageRegion.value,
      null,
    );
});
</script>

<style scoped>
.app-content {
  max-width: none;
  padding: 0;
}
.app-root {
  min-height: 100dvh;
}
</style>
