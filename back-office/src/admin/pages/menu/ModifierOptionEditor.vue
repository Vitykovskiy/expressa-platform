<template>
  <fieldset class="modifier-option-editor" :disabled="props.disabled">
    <legend class="modifier-option-editor__legend">Вариант добавки</legend>
    <label class="modifier-option-editor__label">
      Название
      <AdminTextField
        :aria-invalid="Boolean(props.fieldErrors?.name)"
        :model-value="props.modelValue.name"
        autocomplete="off"
        type="text"
        @update:model-value="updateField('name', $event)"
      />
    </label>
    <p
      v-if="props.fieldErrors?.name"
      class="modifier-option-editor__error"
      role="alert"
    >
      {{ props.fieldErrors.name }}
    </p>
    <label class="modifier-option-editor__label">
      Изменение цены, коп.
      <AdminTextField
        :aria-invalid="Boolean(props.fieldErrors?.priceDeltaMinor)"
        :model-value="props.modelValue.priceDeltaMinor"
        inputmode="numeric"
        type="number"
        @update:model-value="updateField('priceDeltaMinor', $event)"
      />
    </label>
    <p
      v-if="props.fieldErrors?.priceDeltaMinor"
      class="modifier-option-editor__error"
      role="alert"
    >
      {{ props.fieldErrors.priceDeltaMinor }}
    </p>
    <div class="modifier-option-editor__toggle-row">
      <span :id="defaultLabelId">Выбран по умолчанию</span>
      <AdminToggle
        :aria-labelledby="defaultLabelId"
        :model-value="props.modelValue.isDefault"
        @update:model-value="updateField('isDefault', Boolean($event))"
      />
    </div>
    <div class="modifier-option-editor__toggle-row">
      <span :id="availableLabelId">Вариант доступен</span>
      <AdminToggle
        :aria-labelledby="availableLabelId"
        :model-value="props.modelValue.isAvailable"
        @update:model-value="updateField('isAvailable', Boolean($event))"
      />
    </div>
    <div class="modifier-option-editor__actions">
      <AdminButton
        :aria-label="`Переместить ${props.positionLabel} вверх`"
        :disabled="props.disabled || !props.canMoveUp"
        class="modifier-option-editor__move"
        type="button"
        variant="ghost"
        @click="emit('moveUp')"
        >↑</AdminButton
      >
      <AdminButton
        :aria-label="`Переместить ${props.positionLabel} вниз`"
        :disabled="props.disabled || !props.canMoveDown"
        class="modifier-option-editor__move"
        type="button"
        variant="ghost"
        @click="emit('moveDown')"
        >↓</AdminButton
      >
      <AdminButton
        :disabled="props.disabled"
        type="button"
        variant="destructive"
        @click="removeOpen = true"
        >Удалить вариант</AdminButton
      >
    </div>
  </fieldset>
  <ConfirmDialog
    v-model:open="removeOpen"
    confirm-label="Удалить"
    confirm-variant="destructive"
    description="Вариант будет исключён из группы добавок."
    title="Удалить вариант добавки?"
    @confirm="emit('remove')"
  />
</template>

<script setup lang="ts">
import { shallowRef, useId } from "vue";

import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../shared/ui/admin-toggle/AdminToggle.vue";
import ConfirmDialog from "../../shared/ui/confirm-dialog/ConfirmDialog.vue";
import type {
  ModifierOptionDraft,
  ModifierOptionEditorEmits,
  ModifierOptionEditorProps,
} from "./ModifierOptionEditor.types";

const props = defineProps<ModifierOptionEditorProps>();
const emit = defineEmits<ModifierOptionEditorEmits>();
const defaultLabelId = `modifier-option-default-${useId()}`;
const availableLabelId = `modifier-option-available-${useId()}`;
const removeOpen = shallowRef(false);

function updateField<Key extends keyof ModifierOptionDraft>(
  field: Key,
  value: ModifierOptionDraft[Key],
) {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
}
</script>

<style scoped lang="scss">
.modifier-option-editor {
  display: grid;
  gap: var(--expressa-space-sm);
  min-width: 0;
  margin: 0;
  padding: var(--expressa-space-md);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
}
.modifier-option-editor:disabled {
  opacity: var(--expressa-state-disabled-opacity);
}
.modifier-option-editor__legend,
.modifier-option-editor__label,
.modifier-option-editor__toggle-row {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.modifier-option-editor__label {
  display: grid;
  gap: var(--expressa-space-2xs);
}
.modifier-option-editor__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
}
.modifier-option-editor__error {
  margin: 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
}
.modifier-option-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-sm);
}
.modifier-option-editor__move {
  width: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}
</style>
