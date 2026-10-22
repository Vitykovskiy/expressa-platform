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
        :disabled="
          notifications.busy ||
          !notifications.ready ||
          !notifications.verified ||
          notifications.inspection === null ||
          notifications.inspection.association === 'other'
        "
        @click="notifications.enable"
      />
    </template>
  </OperationsModal>
</template>

<script setup lang="ts">
import OperationsModal from "../../shared/ui/operations/OperationsModal.vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import { useNotificationsStore } from "./notifications.store";
import { NOTIFICATION_PURPOSE } from "./notifications.constants";

const notifications = useNotificationsStore();
</script>

<style scoped>
.notification-status {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  overflow-wrap: anywhere;
}
</style>
