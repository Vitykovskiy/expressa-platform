<template>
  <SettingsPage
    v-if="settings.draft"
    :model-value="settings.draft"
    :saving="settings.saving"
    :can-save="settings.canSave"
    :saved="settings.saved"
    :locked="settings.editingDisabled"
    :feedback="feedback"
    @update:model-value="settings.updateDraft"
    @save="settings.save"
  >
    <template #status>
      <SettingsRecovery
        v-if="recoveryCommand"
        :command="recoveryCommand"
        :message="settings.message"
        @inspect="settings.inspectUnknown"
        @finish="settings.finishInspection"
      />
      <div v-else-if="settings.stale" class="settings-route__status">
        <p role="status">{{ settings.message }}</p>
        <OperationsButton
          label="Обновить настройки"
          kind="secondary"
          @click="settings.refresh"
        />
      </div>
      <p v-else-if="loading" class="settings-route__loading" role="status">
        Обновление настроек…
      </p>
    </template>
  </SettingsPage>
  <section
    v-else
    class="settings-route__initial"
    aria-labelledby="settings-route-title"
  >
    <h1 id="settings-route-title" class="settings-route__title">Настройки</h1>
    <p role="status">{{ initialMessage }}</p>
    <OperationsButton
      v-if="failed"
      label="Повторить"
      kind="secondary"
      @click="settings.refresh"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "../../entities/settings/settings.store";
import SettingsRecovery from "../../features/settings/presentation/SettingsRecovery.vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import SettingsPage from "./SettingsPage.vue";

const settings = useSettingsStore();

const recoveryCommand = computed(() => {
  const command = settings.command;

  return command !== null &&
    (command.phase === "unknown" ||
      command.phase === "inspecting" ||
      command.phase === "inspected")
    ? command
    : null;
});
const loading = computed(() => settings.phase === "loading");
const failed = computed(() => settings.phase === "error");
const initialMessage = computed(() =>
  failed.value ? settings.message : "Загрузка настроек…",
);
const feedback = computed(() => {
  if (settings.validationMessage !== "") {
    return settings.validationMessage;
  }

  return recoveryCommand.value !== null || settings.stale
    ? ""
    : settings.message;
});
</script>

<style scoped>
.settings-route__initial {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  width: min(100%, 560px);
  margin: 0 auto;
  padding: 24px;
}

.settings-route__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
}

.settings-route__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.settings-route__status p,
.settings-route__loading {
  margin: 0;
  font-size: 13px;
  line-height: 19.5px;
}

@media (max-width: 767px) {
  .settings-route__initial {
    padding: 16px;
  }

  .settings-route__title {
    font-size: 18px;
    font-weight: 600;
    line-height: 28px;
  }
}
</style>
