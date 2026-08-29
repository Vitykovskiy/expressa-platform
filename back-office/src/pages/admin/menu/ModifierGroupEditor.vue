<template>
  <section
    class="modifier-group-editor"
    aria-labelledby="modifier-group-editor-title"
  >
    <h2 id="modifier-group-editor-title" class="modifier-group-editor__title">
      Группа добавок
    </h2>
    <p v-if="props.loading" class="modifier-group-editor__state" role="status">
      Загрузка группы добавок…
    </p>
    <p
      v-else-if="props.errorMessage"
      class="modifier-group-editor__error"
      role="alert"
    >
      {{ props.errorMessage }}
    </p>
    <form v-else class="modifier-group-editor__form" @submit.prevent="save">
      <fieldset
        :disabled="props.disabled"
        class="modifier-group-editor__fields"
      >
        <label class="modifier-group-editor__label"
          >Название<AdminTextField
            v-model="name"
            :aria-invalid="Boolean(nameError)"
            autocomplete="off"
            type="text"
        /></label>
        <p v-if="nameError" class="modifier-group-editor__error" role="alert">
          {{ nameError }}
        </p>
        <label class="modifier-group-editor__label"
          >Тип выбора<AdminSelect v-model="selectionType"
            ><option
              v-for="option in MODIFIER_SELECTION_TYPE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option></AdminSelect
          ></label
        >
        <div class="modifier-group-editor__toggle-row">
          <span :id="requiredLabelId">Выбор обязателен</span
          ><AdminToggle
            v-model="isRequired"
            :aria-labelledby="requiredLabelId"
          />
        </div>
        <div class="modifier-group-editor__limits">
          <label class="modifier-group-editor__label"
            >Минимум<AdminTextField
              v-model="minSelect"
              inputmode="numeric"
              min="0"
              type="number" /></label
          ><label class="modifier-group-editor__label"
            >Максимум<AdminTextField
              v-model="maxSelect"
              inputmode="numeric"
              min="0"
              type="number"
          /></label>
        </div>
        <p
          v-if="selectionError"
          class="modifier-group-editor__error"
          role="alert"
        >
          {{ selectionError }}
        </p>
        <div class="modifier-group-editor__toggle-row">
          <span :id="activeLabelId">Группа активна</span
          ><AdminToggle v-model="isActive" :aria-labelledby="activeLabelId" />
        </div>
        <section
          aria-labelledby="modifier-options-title"
          class="modifier-group-editor__options"
        >
          <h3 id="modifier-options-title">Варианты добавок</h3>
          <ModifierOptionEditor
            v-for="(option, index) in options"
            :key="option.id ?? index"
            :disabled="props.disabled"
            :field-errors="optionFieldErrors[index]"
            :model-value="option"
            :can-move-up="index > 0"
            :can-move-down="index < options.length - 1"
            :position-label="option.name.trim() || `вариант ${index + 1}`"
            @move-up="moveOption(index, -1)"
            @move-down="moveOption(index, 1)"
            @remove="removeOption(index)"
            @update:model-value="updateOption(index, $event)"
          />
          <AdminButton
            :disabled="props.disabled"
            type="button"
            variant="secondary"
            @click="addOption"
          >
            Добавить вариант
          </AdminButton>
          <p v-if="options.length === 0" class="modifier-group-editor__state">
            Варианты добавок пока не добавлены.
          </p>
        </section>
        <p
          v-if="defaultError"
          class="modifier-group-editor__error"
          role="alert"
        >
          {{ defaultError }}
        </p>
      </fieldset>
      <div class="modifier-group-editor__actions">
        <AdminButton :disabled="props.disabled || !isValid" type="submit"
          >Сохранить группу</AdminButton
        ><AdminButton
          v-if="props.group !== null"
          :disabled="props.disabled"
          type="button"
          variant="destructive"
          @click="archiveOpen = true"
          >Архивировать группу</AdminButton
        ><AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="emit('cancel')"
          >Отмена</AdminButton
        >
      </div>
    </form>
    <ConfirmDialog
      v-model:open="archiveOpen"
      confirm-label="Архивировать"
      confirm-variant="destructive"
      description="Группа добавок больше не будет доступна для назначения."
      title="Архивировать группу добавок?"
      @confirm="archive"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, watch } from "vue";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminSelect from "../../../shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import {
  createEmptyModifierOptionDraft,
  MODIFIER_GROUP_EDITOR_DEFAULTS,
  MODIFIER_SELECTION_TYPE_OPTIONS,
} from "./ModifierGroupEditor.constants";
import type {
  ModifierGroupEditorEmits,
  ModifierGroupEditorProps,
} from "./ModifierGroupEditor.types";
import ModifierOptionEditor from "./ModifierOptionEditor.vue";
import {
  createModifierOptionDraft,
  type ModifierOptionDraft,
  type ModifierOptionFormData,
  type ModifierOptionFormField,
} from "./ModifierOptionEditor.types";

const props = withDefaults(
  defineProps<ModifierGroupEditorProps>(),
  MODIFIER_GROUP_EDITOR_DEFAULTS,
);
const emit = defineEmits<ModifierGroupEditorEmits>();
const name = shallowRef("");
const selectionType = shallowRef<"single" | "multiple">("single");
const minSelect = shallowRef("0");
const maxSelect = shallowRef("1");
const isActive = shallowRef(true);
const options = shallowRef<ModifierOptionDraft[]>([]);
const archiveOpen = shallowRef(false);
const requiredLabelId = `modifier-group-required-${useId()}`;
const activeLabelId = `modifier-group-active-${useId()}`;
const isRequired = computed({
  get: () => Number(minSelect.value) > 0,
  set: (value: boolean) => {
    minSelect.value = value ? "1" : "0";
    if (value && Number(maxSelect.value) < 1) maxSelect.value = "1";
  },
});
const nameError = computed(() =>
  name.value.trim() ? props.fieldErrors?.name : "Введите название группы",
);
const selectionError = computed(() => {
  const min = Number(minSelect.value);
  const max = Number(maxSelect.value);
  if (
    !/^\d+$/.test(minSelect.value) ||
    !/^\d+$/.test(maxSelect.value) ||
    min > max
  )
    return "Минимум и максимум должны быть неотрицательными, минимум не больше максимума";
  if (selectionType.value === "single" && max > 1)
    return "Для одиночного выбора максимум равен одному";
  return props.fieldErrors?.minSelect ?? props.fieldErrors?.maxSelect;
});
const defaultError = computed(() => {
  const defaults = options.value.filter((option) => option.isDefault);
  if (
    defaults.some(
      (option) => !option.isAvailable || Number(option.priceDelta) !== 0,
    )
  )
    return "Вариант по умолчанию должен быть доступным и бесплатным";
  if (
    defaults.length < Number(minSelect.value) ||
    defaults.length > Number(maxSelect.value)
  )
    return "Количество вариантов по умолчанию должно соответствовать границам выбора";
  return props.fieldErrors?.options;
});
const optionFieldErrors = computed(() =>
  options.value.map((option) => {
    const errors: Partial<Record<ModifierOptionFormField, string>> = {};

    if (!option.name.trim()) errors.name = "Введите название варианта";
    if (!isNonNegativeInteger(option.priceDelta)) {
      errors.priceDelta = "Укажите изменение цены в целых рублях";
    }
    const index = options.value.indexOf(option);
    for (const field of [
      "name",
      "priceDelta",
      "isDefault",
      "isAvailable",
    ] as const) {
      const error = props.fieldErrors?.[`options.${index}.${field}`];
      if (error !== undefined) errors[field] = error;
    }

    return errors;
  }),
);
const hasOptionErrors = computed(() =>
  optionFieldErrors.value.some((errors) => Object.keys(errors).length > 0),
);
const isValid = computed(
  () =>
    !nameError.value &&
    !selectionError.value &&
    !defaultError.value &&
    !hasOptionErrors.value,
);

function resetDraft() {
  const group = props.group;
  name.value = group?.name ?? "";
  selectionType.value = group?.selectionType ?? "single";
  minSelect.value = String(group?.minSelect ?? 0);
  maxSelect.value = String(group?.maxSelect ?? 1);
  isActive.value = group?.isActive ?? true;
  options.value = group?.options.map(createModifierOptionDraft) ?? [];
}
function save() {
  if (!isValid.value) return;
  emit("save", {
    id: props.group?.id,
    name: name.value.trim(),
    selectionType: selectionType.value,
    minSelect: Number(minSelect.value),
    maxSelect: Number(maxSelect.value),
    isActive: isActive.value,
    options: options.value.map(toModifierOptionFormData),
  });
}
function archive() {
  if (props.group === null) return;
  emit("archive", props.group.id);
  archiveOpen.value = false;
}
function addOption() {
  options.value = [...options.value, createEmptyModifierOptionDraft()];
}
function updateOption(index: number, option: ModifierOptionDraft) {
  options.value = options.value.map((item, itemIndex) =>
    itemIndex === index ? option : item,
  );
}
function removeOption(index: number) {
  options.value = options.value.filter((_, itemIndex) => itemIndex !== index);
}
function moveOption(index: number, offset: -1 | 1) {
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= options.value.length) return;
  const next = [...options.value];
  [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
  options.value = next;
}
function isNonNegativeInteger(value: string) {
  return (
    value.trim() !== "" &&
    Number.isFinite(Number(value)) &&
    Number.isInteger(Number(value)) &&
    Number(value) >= 0
  );
}
function toModifierOptionFormData(
  option: ModifierOptionDraft,
  sortOrder: number,
): ModifierOptionFormData {
  return {
    id: option.id,
    name: option.name.trim(),
    priceDelta: Number(option.priceDelta),
    sortOrder,
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
  };
}
watch(() => props.group, resetDraft, { immediate: true });
</script>

<style scoped lang="scss">
.modifier-group-editor {
  display: grid;
  gap: var(--expressa-space-md);
  min-width: 0;
  color: var(--expressa-color-text-primary);
}
.modifier-group-editor__title,
.modifier-group-editor__options h3 {
  margin: 0;
  font-size: var(--expressa-font-size-title);
}
.modifier-group-editor__form,
.modifier-group-editor__fields,
.modifier-group-editor__options {
  display: grid;
  gap: var(--expressa-space-md);
  min-width: 0;
}
.modifier-group-editor__fields {
  margin: 0;
  padding: 0;
  border: 0;
}
.modifier-group-editor__label {
  display: grid;
  gap: var(--expressa-space-2xs);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.modifier-group-editor__limits,
.modifier-group-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-md);
}
.modifier-group-editor__limits > * {
  flex: 1 1 10rem;
}
.modifier-group-editor__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
}
.modifier-group-editor__error {
  margin: 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
}
.modifier-group-editor__state {
  margin: 0;
  color: var(--expressa-color-text-muted);
}
</style>
