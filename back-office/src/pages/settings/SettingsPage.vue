<template>
  <section class="settings-page" aria-label="Настройки">
    <SettingsForm
      :model-value="props.modelValue"
      :saving="props.saving"
      :can-save="props.canSave"
      :locked="props.locked"
      @update:model-value="emit('update:modelValue', $event)"
      @save="emit('save')"
    >
      <template #status><slot name="status" /></template>
    </SettingsForm>
    <div v-if="feedbackMessage" class="settings-page__feedback">
      <SourceToast :type="feedbackType" :message="feedbackMessage" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SettingsForm from "../../widgets/settings/SettingsForm.vue";
import SourceToast from "../../shared/ui/SourceToast/SourceToast.vue";
import type {
  SettingsPageEmits,
  SettingsPageProps,
  SettingsPageSlots,
} from "./SettingsPage.types";

const props = defineProps<SettingsPageProps>();
const emit = defineEmits<SettingsPageEmits>();

defineSlots<SettingsPageSlots>();

const feedbackMessage = computed(() => {
  if (props.feedback !== "") {
    return props.feedback;
  }

  return props.saved ? "Настройки сохранены" : "";
});
const feedbackType = computed(() =>
  props.feedback !== "" ? "error" : "success",
);
</script>

<style scoped>
.settings-page {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: var(--color-surface);
}

.settings-page__feedback {
  position: fixed;
  z-index: 2500;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

@media (max-width: 600px) {
  .settings-page__feedback {
    top: 16px;
  }
}
</style>
