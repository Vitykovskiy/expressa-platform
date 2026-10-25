<template>
  <OperationsModal
    :open="notifications.open"
    title="Уведомления"
    :description="NOTIFICATION_PURPOSE"
    bottom-sheet
    @close="notifications.close"
  >
    <p class="notification-status" role="status">{{ notifications.message }}</p>
    <template #actions>
      <OperationsButton
        v-if="!notifications.ready"
        label="Подготовить уведомления"
        :disabled="notifications.busy"
        kind="secondary"
        @click="notifications.prepare"
      />
      <OperationsButton
        v-else
        label="Проверить состояние"
        :disabled="notifications.busy"
        kind="secondary"
        @click="notifications.inspect"
      />
      <OperationsButton
        v-if="notifications.command"
        label="Завершить сверку"
        :disabled="notifications.busy || !notifications.inspectedUnknown"
        @click="notifications.finishInspection"
      />
      <OperationsButton
        v-else-if="notifications.inspection?.association === 'current'"
        label="Отключить уведомления"
        :disabled="notifications.busy || !notifications.verified"
        @click="notifications.disable"
      />
      <OperationsButton
        v-else
        label="Включить уведомления"
        :disabled="enableDisabled"
        @click="notifications.enable"
      />
    </template>
  </OperationsModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OperationsModal from "../../../shared/ui/operations/OperationsModal.vue";
import OperationsButton from "../../../shared/ui/operations/OperationsButton.vue";
import { useNotificationsStore } from "../model/notifications.store";
import { NOTIFICATION_PURPOSE } from "./NotificationsDialog.constants";

const notifications = useNotificationsStore();

const enableDisabled = computed(() => {
  if (notifications.busy || !notifications.ready || !notifications.verified) {
    return true;
  }

  const inspection = notifications.inspection;

  if (inspection === null) {
    return true;
  }

  return inspection.association === "other";
});
</script>

<style scoped>
/* Локальная типографика статуса: тема задаёт цвет, отдельной шкалы размеров нет. */
.notification-status {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  overflow-wrap: anywhere;
}
</style>
