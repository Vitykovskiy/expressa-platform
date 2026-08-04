<template>
  <VApp>
    <VMain>
      <VContainer class="py-8">
        <ErrorNotice
          :error="appStore.screenError"
          @close="appStore.clearScreenError"
        />
        <template v-if="bootstrapState.ready">
          <VBtn v-if="sessionStore.status === 'authenticated'" @click="logout">
            Выйти
          </VBtn>
          <RouterView />
        </template>
      </VContainer>
    </VMain>
  </VApp>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { VApp, VBtn, VContainer, VMain } from "vuetify/components";
import { RouterView, useRouter } from "vue-router";

import ErrorNotice from "../shared/ui/ErrorNotice.vue";
import { useCartStore } from "../customer/shared/model/cart.store";

import { useAppStore } from "./app.store";
import { appRoute } from "./App.constants";
import type { AppBootstrapState } from "./App.types";
import { useSessionStore } from "./session.store";

const appStore = useAppStore();
const cartStore = useCartStore();
const sessionStore = useSessionStore();
const router = useRouter();
const bootstrapState = reactive<AppBootstrapState>({ ready: false });

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
</script>
