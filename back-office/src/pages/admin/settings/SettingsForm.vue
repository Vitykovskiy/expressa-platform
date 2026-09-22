<template>
  <form class="settings-form" @submit.prevent="save">
    <div class="settings-form__content">
      <section
        class="settings-form__section"
        aria-labelledby="working-hours-title"
      >
        <header class="settings-form__section-header">
          <h2 id="working-hours-title" class="settings-form__section-title">
            Рабочие часы
          </h2>
        </header>
        <div class="settings-form__section-content">
          <AdminFieldWrapper
            id="settings-working-hours-open"
            v-slot="field"
            label="Открытие"
            required
          >
            <AdminTextField
              :id="field.controlId"
              v-model="draft.workingHoursOpen"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              class="settings-form__input"
              :required="field.required"
              type="time"
            />
          </AdminFieldWrapper>
          <AdminFieldWrapper
            id="settings-working-hours-close"
            v-slot="field"
            label="Закрытие"
            required
          >
            <AdminTextField
              :id="field.controlId"
              v-model="draft.workingHoursClose"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              class="settings-form__input"
              :required="field.required"
              type="time"
            />
          </AdminFieldWrapper>
        </div>
      </section>

      <section
        class="settings-form__section settings-form__section--slots"
        aria-labelledby="slot-capacity-title"
      >
        <header class="settings-form__section-header">
          <h2 id="slot-capacity-title" class="settings-form__section-title">
            Слоты
          </h2>
        </header>
        <div class="settings-form__section-content">
          <AdminFieldWrapper
            id="settings-slot-capacity"
            v-slot="field"
            label="Вместимость слота (заказов)"
            required
          >
            <AdminTextField
              :id="field.controlId"
              v-model.number="draft.slotCapacity"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              class="settings-form__input"
              max="50"
              min="1"
              :required="field.required"
              type="number"
            />
          </AdminFieldWrapper>
        </div>
      </section>
    </div>

    <footer class="settings-form__actions">
      <AdminButton class="settings-form__submit" type="submit">
        Сохранить
      </AdminButton>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";

import type { Settings } from "../../../shared/ui/admin/Admin.types";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import type {
  SettingsFormEmits,
  SettingsFormProps,
} from "./SettingsForm.types";

const props = defineProps<SettingsFormProps>();

const emit = defineEmits<SettingsFormEmits>();

const draft = reactive<Settings>({ ...props.settings });

watch(
  () => props.settings,
  (settings) => Object.assign(draft, settings),
);

function save() {
  emit("save", { ...draft });
}
</script>

<style scoped lang="scss">
.settings-form {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-rows: minmax(0, 1fr) auto;
}

.settings-form__content {
  min-width: 0;
  overflow-y: auto;
  padding: var(--expressa-space-md) var(--expressa-space-md)
    var(--expressa-space-tab-bar-clearance);
}

.settings-form__section {
  overflow: hidden;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface);
}

.settings-form__section + .settings-form__section {
  margin-top: var(--expressa-space-lg);
}

.settings-form__section-header {
  padding: var(--expressa-space-control-inline) var(--expressa-space-md);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.settings-form__section-title {
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-semibold);
  letter-spacing: var(--expressa-letter-spacing-section-title);
  line-height: var(--expressa-line-height-heading);
}

.settings-form__section-content {
  display: grid;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-md);
}

.settings-form__input {
  width: 100%;
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-regular);
  line-height: calc(
    var(--expressa-font-size-body) + var(--expressa-space-field-label)
  );
}

.settings-form__input:focus {
  outline: var(--expressa-border-width-strong) solid
    color-mix(in srgb, var(--expressa-color-accent) 20%, transparent);
  outline-offset: 0;
}

.settings-form__actions {
  padding: var(--expressa-space-md) var(--expressa-space-md) 0;
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-surface);
}

.settings-form__submit {
  width: 100%;
}

@media (min-width: 768px) {
  .settings-form__content {
    padding: var(--expressa-space-md) var(--expressa-space-lg)
      var(--expressa-space-lg);
  }

  .settings-form__actions {
    margin-bottom: var(--expressa-space-lg);
  }
}
</style>
