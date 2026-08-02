<template>
  <VApp>
    <VMain>
      <!-- Vue lint requires one attribute per line; prettier-ignore preserves it. -->
      <!-- prettier-ignore -->
      <VContainer
        class="app-content"
      >
        <header class="app-header">
          <p class="app-name">
            Expressa back-office
          </p>
          <nav
            aria-label="Рабочие разделы"
            class="app-navigation"
          >
            <RouterLink
              v-for="item in navigationItems"
              :key="item.path"
              :to="item.path"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </header>
        <ErrorNotice
          v-if="appStore.screenError !== null"
          :error="appStore.screenError"
          @close="appStore.clearScreenError"
        />
        <RouterView />
      </VContainer>
    </VMain>
  </VApp>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { VApp, VContainer, VMain } from "vuetify/components";

import ErrorNotice from "../shared/ui/ErrorNotice.vue";

import { useAppStore } from "./app.store";
import { navigationItems } from "./navigation";

const appStore = useAppStore();
</script>

<style scoped>
.app-content {
  padding-block: var(--expressa-space-8);
}

.app-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--expressa-space-4);
  margin-bottom: var(--expressa-space-8);
}

.app-name {
  margin: 0;
  font-weight: var(--expressa-font-weight-strong);
  overflow-wrap: anywhere;
}

.app-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-2);
}

/* RouterLink renders its anchor internally; boundary is application navigation only. */
.app-navigation :deep(a) {
  display: inline-flex;
  align-items: center;
  min-height: var(--expressa-touch-target-min);
  padding-inline: var(--expressa-space-2);
  border-radius: var(--expressa-radius-control);
  color: rgb(var(--v-theme-primary));
  font-weight: var(--expressa-font-weight-strong);
  overflow-wrap: anywhere;
}

/* RouterLink focus target is its internal anchor; boundary is application navigation only. */
.app-navigation :deep(a:focus-visible) {
  outline: var(--expressa-focus-outline);
  outline-offset: var(--expressa-focus-offset);
}

@media (max-width: 479px) {
  .app-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
