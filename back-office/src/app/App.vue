<template>
  <VApp>
    <VMain>
      <div class="app-root">
        <VContainer class="app-content">
          <NotificationHost
            :candidate-entries="notificationEntries"
            :entries="visibleNotificationEntries"
            @dismiss="dismissNotification"
            @recover="notificationRuntime.recover"
            @visibility="notificationRuntime.setVisibility"
          />
          <div class="app-screen">
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
          </div>
        </VContainer>
      </div>
    </VMain>
  </VApp>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, shallowRef } from "vue";
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

import { createNavigationItems } from "./navigation";
import { routePaths } from "./router.constants";
import { useSessionStore } from "./session.store";
import type { AppRoute } from "./App.types";

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const injectedNotificationRuntime = inject(notificationRuntimeKey);
if (injectedNotificationRuntime === undefined)
  throw new Error("Notification root is not configured.");
const notificationRuntime = injectedNotificationRuntime;
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
}

onBeforeUnmount(() => {
  unsubscribeNotifications();
});
</script>

<style scoped>
.app-content {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  max-width: none;
  height: 100dvh;
  overflow: hidden;
  padding: 0;
}
.app-root {
  min-height: 100dvh;
}
.app-screen {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
</style>
