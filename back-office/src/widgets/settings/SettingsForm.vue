<template>
  <form class="settings-form" :aria-busy="props.saving" @submit.prevent="save">
    <div class="settings-form__scroll">
      <header class="settings-form__header">
        <h1 class="settings-form__title">Настройки</h1>
      </header>
      <SettingsFields
        :model-value="props.modelValue"
        :disabled="fieldsDisabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <slot name="status" />
    </div>
    <footer class="settings-form__footer">
      <OperationsButton
        class="settings-form__save"
        :label="saveLabel"
        type="submit"
        :disabled="saveDisabled"
      />
    </footer>
  </form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SettingsFields from "../../features/settings/ui/SettingsFields.vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import type {
  SettingsFormEmits,
  SettingsFormProps,
  SettingsFormSlots,
} from "./SettingsForm.types";

const props = defineProps<SettingsFormProps>();
const emit = defineEmits<SettingsFormEmits>();

defineSlots<SettingsFormSlots>();

const fieldsDisabled = computed(() => props.saving || props.locked);
const saveDisabled = computed(() => props.saving || !props.canSave);
const saveLabel = computed(() => (props.saving ? "Сохранение…" : "Сохранить"));

function save() {
  if (saveDisabled.value) {
    return;
  }

  emit("save");
}
</script>

<style scoped>
/* Локальная ширина формы и интервалы сохраняют компоновку настроек;
   тема не содержит шкалы размеров и типографики для этого экрана. */
.settings-form {
  display: flex;
  flex: 0 1 560px;
  flex-direction: column;
  width: min(100%, 560px);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  background: var(--color-surface);
  color: var(--color-foreground);
}

.settings-form__scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  padding: 24px;
  overflow: auto;
}

.settings-form__header {
  flex-shrink: 0;
  padding-bottom: 8px;
}

.settings-form__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
}

.settings-form__footer {
  flex-shrink: 0;
  margin-bottom: 24px;
  padding: 16px 16px 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.settings-form__save {
  width: 100%;
  min-height: 40px;
}

/* На узкой ширине заголовок остаётся над собственной прокруткой формы,
   а нижнее действие сохраняет прежнее положение без внешнего отступа. */
@media (max-width: 767px) {
  .settings-form {
    background: var(--color-background);
  }

  .settings-form__scroll {
    padding: 0 16px 16px;
  }

  .settings-form__header {
    position: sticky;
    z-index: 1;
    top: 0;
    display: flex;
    align-items: center;
    min-height: 52px;
    margin: 0 -16px -8px;
    padding: 0 16px;
    background: var(--color-surface);
  }

  .settings-form__title {
    font-size: 18px;
    font-weight: 600;
    line-height: 28px;
  }

  .settings-form__footer {
    margin-bottom: 0;
  }
}
</style>
