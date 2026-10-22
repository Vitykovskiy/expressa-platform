<template>
  <div class="settings-fields">
    <section
      class="settings-fields__section"
      aria-labelledby="settings-hours"
      title="Рабочие часы указаны в UTC"
      aria-describedby="settings-time-basis"
    >
      <h2 id="settings-hours" class="settings-fields__heading">РАБОЧИЕ ЧАСЫ</h2>
      <span id="settings-time-basis" class="settings-fields__time-basis"
        >Время UTC</span
      >
      <div class="settings-fields__hours">
        <OperationsInput
          label="Открытие"
          type="time"
          :model-value="props.modelValue.opensAt"
          :disabled="props.disabled"
          required
          @update:model-value="updateField('opensAt', $event)"
        />
        <OperationsInput
          label="Закрытие"
          type="time"
          :model-value="props.modelValue.closesAt"
          :disabled="props.disabled"
          required
          @update:model-value="updateField('closesAt', $event)"
        />
      </div>
    </section>
    <section class="settings-fields__section" aria-labelledby="settings-slots">
      <h2 id="settings-slots" class="settings-fields__heading">СЛОТЫ</h2>
      <div class="settings-fields__capacity">
        <OperationsInput
          label="Вместимость слота (заказов)"
          type="number"
          :model-value="props.modelValue.slotCapacity"
          :disabled="props.disabled"
          required
          step="1"
          aria-describedby="settings-capacity-help"
          @update:model-value="updateField('slotCapacity', $event)"
        />
        <p id="settings-capacity-help" class="settings-fields__help">
          Сколько активных заказов помещается в один 10-минутный слот
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import OperationsInput from "../../../shared/ui/operations/OperationsInput.vue";
import type { SettingsDraft } from "../../../entities/settings/settings.types";
import type {
  SettingsFieldsEmits,
  SettingsFieldsProps,
} from "./SettingsFields.types";

const props = defineProps<SettingsFieldsProps>();
const emit = defineEmits<SettingsFieldsEmits>();

function updateField(field: keyof SettingsDraft, value: string) {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
}
</script>

<style scoped>
.settings-fields {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
}

.settings-fields__section {
  overflow: clip;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
}

.settings-fields__time-basis {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.settings-fields__heading,
.settings-fields__hours,
.settings-fields__capacity {
  /* В макете внутренний блок сохраняет ширину карточки внутри её рамки. */
  width: calc(100% + 2px);
}

.settings-fields__heading {
  margin: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-foreground-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
}

.settings-fields__hours {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.settings-fields__capacity {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
}

.settings-fields__help {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}
</style>
