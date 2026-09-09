<template>
  <VApp>
    <VMain>
      <VContainer class="app-content">
        <section
          v-if="
            sessionStore.status === 'unknown' && route.path !== routePaths.login
          "
          aria-label="Загрузка"
          class="app-loading"
          role="status"
        >
          <VProgressCircular
            aria-hidden="true"
            color="primary"
            indeterminate
            :size="28"
            :width="2"
          />
          <span>Подождите…</span>
        </section>
        <template v-else>
          <ErrorNotice
            v-if="appStore.screenError !== null"
            :error="appStore.screenError"
            @close="appStore.clearScreenError"
          />
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
    </VMain>
  </VApp>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { VApp, VContainer, VMain, VProgressCircular } from "vuetify/components";

import AdminShell from "../widgets/admin-shell/AdminShell.vue";
import type { AdminSection } from "../shared/ui/admin/Admin.types";
import { adminShellFallbackSection } from "../widgets/admin-shell/AdminShell.constants";
import ErrorNotice from "../shared/ui/ErrorNotice.vue";

import { useAppStore } from "./app.store";
import { createNavigationItems } from "./navigation";
import { routePaths } from "./router.constants";
import { useSessionStore } from "./session.store";
import type { AppRoute } from "./App.types";

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();

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
</script>

<style scoped>
.app-content {
  height: 100dvh;
  max-width: none;
  padding: 0;
}

.app-loading {
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  gap: var(--expressa-space-control-inline);
  justify-content: center;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
  text-align: center;
}
</style>
