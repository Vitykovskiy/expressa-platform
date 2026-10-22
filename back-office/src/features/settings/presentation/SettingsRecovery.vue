<template>
  <section class="settings-recovery" aria-label="Проверка сохранения">
    <p class="settings-recovery__message" role="status">{{ props.message }}</p>
    <dl v-if="props.command.observed" class="settings-recovery__values">
      <div>
        <dt>Открытие, UTC</dt>
        <dd>{{ props.command.observed.opensAt }}</dd>
      </div>
      <div>
        <dt>Закрытие, UTC</dt>
        <dd>{{ props.command.observed.closesAt }}</dd>
      </div>
      <div>
        <dt>Вместимость слота</dt>
        <dd>{{ props.command.observed.slotCapacity }}</dd>
      </div>
    </dl>
    <div class="settings-recovery__actions">
      <OperationsButton
        :label="inspectLabel"
        kind="secondary"
        :disabled="inspecting"
        @click="emit('inspect')"
      />
      <OperationsButton
        v-if="inspected"
        label="Завершить сверку"
        @click="emit('finish')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OperationsButton from "../../../shared/ui/operations/OperationsButton.vue";
import type {
  SettingsRecoveryEmits,
  SettingsRecoveryProps,
} from "./SettingsRecovery.types";

const props = defineProps<SettingsRecoveryProps>();
const emit = defineEmits<SettingsRecoveryEmits>();

const inspecting = computed(() => props.command.phase === "inspecting");
const inspected = computed(() => props.command.phase === "inspected");
const inspectLabel = computed(() =>
  inspecting.value ? "Проверка…" : "Проверить состояние",
);
</script>

<style scoped>
.settings-recovery {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  font-size: 13px;
  line-height: 19.5px;
}

.settings-recovery__message,
.settings-recovery__values {
  margin: 0;
}

.settings-recovery__values > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.settings-recovery__values dd {
  margin: 0;
}

.settings-recovery__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
