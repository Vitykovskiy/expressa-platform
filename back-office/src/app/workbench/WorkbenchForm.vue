<template>
  <section class="workbench-form" aria-labelledby="form-heading">
    <h2 id="form-heading" class="foundation-section-title">Поля и действия</h2>
    <form class="workbench-form__fields" @submit.prevent="save">
      <UiTextField v-model="name" label="Название" :error="fieldError" />
      <UiSelect
        v-model="category"
        label="Категория"
        :options="categoryOptions"
      />
      <UiCheckbox v-model="included" label="Показывать в списке" />
      <UiSwitch
        :model-value="available"
        label="Доступен"
        :pending="availabilityPending"
        @update:model-value="requestAvailability"
      />
      <div v-if="availabilityPending" class="ui-actions">
        <UiButton @activate="confirmAvailability"
          >Подтвердить изменение</UiButton
        ><UiButton variant="quiet" @activate="cancelAvailability"
          >Отменить</UiButton
        >
      </div>
      <div class="ui-actions">
        <UiButton
          type="submit"
          variant="primary"
          :loading="saveState === 'pending'"
          >Сохранить</UiButton
        ><UiButton
          variant="quiet"
          :disabled="saveState === 'pending'"
          @activate="reset"
          >Отмена</UiButton
        >
      </div>
      <UiFeedback
        v-if="feedback"
        :kind="feedback.kind"
        :text="feedback.text"
        announced
        ><template v-if="saveState === 'error'" #action
          ><UiButton @activate="save">Повторить</UiButton></template
        ></UiFeedback
      >
    </form>
    <details class="workbench-form__controls">
      <summary>Состояния примера</summary>
      <div class="workbench-form__demo">
        <UiFilterGroup
          v-model="outcome"
          label="Результат сохранения"
          :options="resultOptions"
        />
        <div class="ui-actions">
          <UiButton :disabled="saveState !== 'pending'" @activate="finishSave"
            >Завершить сохранение</UiButton
          ><UiButton variant="quiet" @activate="useLongContent"
            >Длинный текст</UiButton
          >
        </div>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiSelect from "../../shared/ui/UiSelect/UiSelect.vue";
import UiCheckbox from "../../shared/ui/UiCheckbox/UiCheckbox.vue";
import UiSwitch from "../../shared/ui/UiSwitch/UiSwitch.vue";
import UiFeedback from "../../shared/ui/UiFeedback/UiFeedback.vue";
import UiFilterGroup from "../../shared/ui/UiFilterGroup/UiFilterGroup.vue";
import {
  categoryOptions,
  initialName,
  longName,
  resultOptions,
  saveFeedback,
} from "./workbench.constants";
import type { SaveState } from "./workbench.types";

const name = shallowRef(initialName);
const category = shallowRef<string | null>("drinks");
const included = shallowRef(true);
const available = shallowRef(true);
const availabilityIntent = shallowRef<boolean | null>(null);
const saveState = shallowRef<SaveState>("idle");
const outcome = shallowRef("success");
const fieldError = shallowRef<string | undefined>();

const availabilityPending = computed(() => availabilityIntent.value !== null);
const feedback = computed(() =>
  saveState.value === "idle" ? null : saveFeedback[saveState.value],
);

function save() {
  if (saveState.value === "pending") {
    return;
  }

  fieldError.value = undefined;
  saveState.value = "pending";
}

function finishSave() {
  if (saveState.value !== "pending") {
    return;
  }

  if (outcome.value === "error") {
    saveState.value = "error";
    fieldError.value = "Не удалось сохранить название";
  } else {
    saveState.value = "success";
  }
}

function reset() {
  name.value = initialName;
  category.value = "drinks";
  included.value = true;
  saveState.value = "idle";
  fieldError.value = undefined;
}

function requestAvailability(value: boolean) {
  availabilityIntent.value = value;
}

function confirmAvailability() {
  if (availabilityIntent.value === null) {
    return;
  }

  available.value = availabilityIntent.value;
  availabilityIntent.value = null;
}

function cancelAvailability() {
  availabilityIntent.value = null;
}

function useLongContent() {
  name.value = longName;
  category.value = "seasonal";
}
</script>

<style scoped>
.workbench-form {
  display: grid;
  align-content: start;
  gap: var(--section-gap);
  min-inline-size: 0;
}
.workbench-form__fields {
  display: grid;
  gap: var(--field-group-gap);
}
.workbench-form__controls {
  border-block-start: var(--border-width) solid var(--color-border);
  padding-block-start: var(--space-lg);
  font-size: var(--font-label);
  color: var(--color-foreground-muted);
}
.workbench-form__controls summary {
  min-block-size: var(--control-height);
  cursor: pointer;
  padding-block: var(--space-sm);
}
.workbench-form__demo {
  display: grid;
  gap: var(--space-lg);
  padding-block-start: var(--space-sm);
}
</style>
