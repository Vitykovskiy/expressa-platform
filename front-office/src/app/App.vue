<script setup lang="ts">
import { VApp, VContainer, VMain } from 'vuetify/components'
import { RouterView } from 'vue-router'

import ErrorNotice from '../shared/ui/ErrorNotice.vue'

import { useAppStore } from './app.store'

const appStore = useAppStore()
</script>

<template>
  <VApp>
    <VMain>
      <VContainer class="py-8">
        <ErrorNotice
          :error="appStore.screenError"
          @close="appStore.clearScreenError"
        />
        <RouterView />
      </VContainer>
    </VMain>
  </VApp>
</template>
