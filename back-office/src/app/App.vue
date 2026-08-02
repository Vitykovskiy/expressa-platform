<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { VApp, VContainer, VMain } from 'vuetify/components'

import ErrorNotice from '../shared/ui/ErrorNotice.vue'

import { useAppStore } from './app.store'
import { navigationItems } from './navigation'

const appStore = useAppStore()
</script>

<template>
  <VApp>
    <VMain>
      <VContainer class="py-8">
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

<style scoped>
.app-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.app-name {
  margin: 0;
  font-weight: 700;
}

.app-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
