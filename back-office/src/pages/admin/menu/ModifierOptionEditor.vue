<template>
  <article
    class="modifier-option-editor"
    :class="{ 'modifier-option-editor--disabled': props.disabled }"
  >
    <div class="modifier-option-editor__body">
      <AdminFieldWrapper
        :id="nameInputId"
        v-slot="field"
        :error="props.fieldErrors?.name"
        label="Название"
        required
      >
        <AdminTextField
          :id="field.controlId"
          data-testid="modifier-option-name"
          :disabled="props.disabled"
          :model-value="props.modelValue.name"
          autocomplete="off"
          :required="field.required"
          type="text"
          @update:model-value="updateField('name', $event)"
        />
      </AdminFieldWrapper>
      <AdminFieldWrapper
        :id="priceDeltaInputId"
        v-slot="field"
        :error="props.fieldErrors?.priceDelta"
        label="Изменение цены, ₽"
        required
      >
        <AdminTextField
          :id="field.controlId"
          :disabled="props.disabled"
          :model-value="props.modelValue.priceDelta"
          inputmode="numeric"
          :required="field.required"
          type="number"
          @update:model-value="updateField('priceDelta', $event)"
        />
      </AdminFieldWrapper>
      <AdminFieldWrapper
        :id="defaultControlId"
        v-slot="field"
        :error="props.fieldErrors?.isDefault"
        label="По умолчанию"
        layout="row"
      >
        <AdminToggle
          :id="field.controlId"
          :disabled="props.disabled"
          :model-value="props.modelValue.isDefault"
          @update:model-value="updateField('isDefault', Boolean($event))"
        />
      </AdminFieldWrapper>
      <AdminFieldWrapper
        :id="availableControlId"
        v-slot="field"
        label="Доступен"
        layout="row"
      >
        <AdminToggle
          :id="field.controlId"
          :disabled="props.disabled"
          :model-value="props.modelValue.isAvailable"
          @update:model-value="updateField('isAvailable', Boolean($event))"
        />
      </AdminFieldWrapper>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useId } from "vue";

import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import type {
  ModifierOptionDraft,
  ModifierOptionEditorEmits,
  ModifierOptionEditorProps,
} from "./ModifierOptionEditor.types";

const props = defineProps<ModifierOptionEditorProps>();
const emit = defineEmits<ModifierOptionEditorEmits>();
const nameInputId = `modifier-option-name-${useId()}`;
const priceDeltaInputId = `modifier-option-price-delta-${useId()}`;
const defaultControlId = `modifier-option-default-${useId()}`;
const availableControlId = `modifier-option-available-${useId()}`;

function updateField(
  field: keyof ModifierOptionDraft,
  value: ModifierOptionDraft[keyof ModifierOptionDraft],
) {
  if (props.disabled) return;
  if (field === "name" || field === "priceDelta") emit("touch", field);
  emit("update:modelValue", { ...props.modelValue, [field]: value });
}
</script>

<style scoped lang="scss">
.modifier-option-editor {
  display: grid;
  gap: var(--expressa-space-sm);
  min-width: 0;
  margin: 0;
}
.modifier-option-editor--disabled {
  opacity: var(--expressa-state-disabled-opacity);
}
.modifier-option-editor__body {
  display: grid;
  align-items: start;
  gap: var(--expressa-space-md);
  min-width: 0;
}
@media (min-width: 768px) {
  .modifier-option-editor__body {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
  .modifier-option-editor__body > :nth-child(n + 3) {
    grid-column: 1 / -1;
  }
}
</style>
