<template>
  <v-app class="settings-screen">
    <TopBar title="Настройки" />
    <main class="settings-screen__content">
      <h1 class="settings-screen__title">Настройки</h1>
      <SettingsForm :settings="settings" @save="save" />
    </main>
    <v-snackbar
      v-model="snackbarOpen"
      :timeout="SETTINGS_SNACKBAR_TIMEOUT"
      role="status"
    >
      Настройки сохранены
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";

import TopBar from "../../../widgets/admin-shell/TopBar.vue";
import SettingsForm from "./SettingsForm.vue";
import { SETTINGS_SNACKBAR_TIMEOUT } from "./SettingsScreen.constants";
import type {
  SettingsScreenEmits,
  SettingsScreenProps,
} from "./SettingsScreen.types";

defineProps<SettingsScreenProps>();

const emit = defineEmits<SettingsScreenEmits>();

const snackbarOpen = shallowRef(false);

function save(settings: SettingsScreenProps["settings"]) {
  emit("save", settings);
  snackbarOpen.value = true;
}
</script>

<style scoped lang="scss">
.settings-screen {
  display: flex;
  min-width: 0;
  min-height: 100%;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface-raised);
}

.settings-screen__content {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  margin: 0 auto;
  padding: var(--expressa-space-md);
}

.settings-screen__title {
  flex: 0 0 auto;
  display: none;
  margin: 0;
  padding: var(--expressa-space-lg) var(--expressa-space-lg) 0;
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: calc(
    var(--expressa-font-size-screen-title) + var(--expressa-space-xs) * 2
  );
  margin-bottom: var(--expressa-space-md);
}

@media (min-width: 768px) {
  .settings-screen {
    background: var(--expressa-color-surface);
  }

  .settings-screen__title {
    display: block;
  }

  .settings-screen__content {
    width: min(100%, var(--expressa-size-settings-content-max-width));
  }
}
</style>
