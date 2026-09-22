<template>
  <section
    class="modifier-group-editor"
    :aria-labelledby="
      props.embedded ? undefined : 'modifier-group-editor-title'
    "
  >
    <form
      :id="props.formId"
      class="modifier-group-editor__form"
      @submit.prevent="save"
    >
      <header v-if="!props.embedded" class="modifier-group-editor__header">
        <h2
          id="modifier-group-editor-title"
          class="modifier-group-editor__title"
        >
          Группа добавок
        </h2>
        <AdminActionGroup
          align="end"
          class="modifier-group-editor__header-actions"
        >
          <AdminButton
            :disabled="isDraftActionLocked || !isValid"
            type="submit"
          >
            Сохранить
          </AdminButton>
          <AdminButton
            v-if="props.group !== null"
            aria-label="Архивировать группу"
            :disabled="isDraftActionLocked"
            class="modifier-group-editor__icon-action"
            type="button"
            variant="destructive"
            @click="openArchive"
          >
            <AdminIcon :icon="Archive" />
          </AdminButton>
          <AdminButton
            aria-label="Закрыть"
            :disabled="isDismissalLocked"
            class="modifier-group-editor__icon-action"
            type="button"
            variant="ghost"
            @click="cancel"
          >
            <AdminIcon :icon="X" />
          </AdminButton>
        </AdminActionGroup>
      </header>
      <p
        v-if="props.loading"
        class="modifier-group-editor__state"
        role="status"
      >
        Загрузка группы добавок…
      </p>
      <fieldset
        :disabled="isDraftActionLocked"
        class="modifier-group-editor__fields"
      >
        <AdminFieldWrapper
          :id="nameInputId"
          v-slot="field"
          :error="shownNameError"
          label="Название"
          required
        >
          <AdminTextField
            :id="field.controlId"
            :aria-describedby="field.describedBy"
            :model-value="name"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
            autocomplete="off"
            :required="field.required"
            type="text"
            @update:model-value="updateGroupField('name', $event)"
          />
        </AdminFieldWrapper>
        <AdminFieldWrapper
          :id="selectionTypeId"
          v-slot="field"
          :error="shownSelectionTypeError"
          label="Тип выбора"
          required
        >
          <AdminSelect
            :id="field.controlId"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
            :model-value="selectionType"
            :required="field.required"
            @update:model-value="updateGroupField('selectionType', $event)"
            ><option
              v-for="option in MODIFIER_SELECTION_TYPE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option></AdminSelect
          >
        </AdminFieldWrapper>
        <AdminFieldWrapper
          :id="requiredControlId"
          v-slot="field"
          label="Выбор обязателен"
          layout="row"
        >
          <AdminToggle
            :id="field.controlId"
            v-model="isRequired"
            :aria-labelledby="field.labelId"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
          />
        </AdminFieldWrapper>
        <div class="modifier-group-editor__limits">
          <AdminFieldWrapper
            :id="minSelectId"
            v-slot="field"
            :error="shownMinSelectError"
            label="Минимум"
            required
          >
            <AdminTextField
              :id="field.controlId"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              :model-value="minSelect"
              inputmode="numeric"
              min="0"
              :required="field.required"
              type="number"
              @update:model-value="updateGroupField('minSelect', $event)"
            />
          </AdminFieldWrapper>
          <AdminFieldWrapper
            :id="maxSelectId"
            v-slot="field"
            :error="shownMaxSelectError"
            label="Максимум"
            required
          >
            <AdminTextField
              :id="field.controlId"
              :model-value="maxSelect"
              :aria-describedby="field.describedBy"
              :aria-invalid="field.invalid"
              :aria-required="field.required"
              inputmode="numeric"
              min="0"
              :required="field.required"
              type="number"
              @update:model-value="updateGroupField('maxSelect', $event)"
            />
          </AdminFieldWrapper>
        </div>
        <AdminFieldWrapper
          :id="activeControlId"
          v-slot="field"
          label="Группа активна"
          layout="row"
        >
          <AdminToggle
            :id="field.controlId"
            v-model="active"
            :aria-labelledby="field.labelId"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid"
            :aria-required="field.required"
          />
        </AdminFieldWrapper>
        <section
          :aria-describedby="shownDefaultError ? optionsErrorId : undefined"
          aria-labelledby="modifier-options-title"
          class="modifier-group-editor__options"
        >
          <h3 id="modifier-options-title">Варианты добавок</h3>
          <section
            v-for="(option, index) in options"
            :key="option.id ?? index"
            ref="optionRows"
            class="modifier-group-editor__option"
          >
            <header class="modifier-group-editor__option-header">
              <h3>Вариант {{ index + 1 }} из {{ options.length }}</h3>
              <AdminActionGroup class="modifier-group-editor__option-actions">
                <AdminButton
                  :aria-label="`Переместить вариант ${index + 1} вверх`"
                  :disabled="isDraftActionLocked || index === 0"
                  class="modifier-group-editor__icon-action"
                  type="button"
                  variant="ghost"
                  @click="moveOption(index, -1)"
                  ><AdminIcon :icon="ChevronUp"
                /></AdminButton>
                <AdminButton
                  :aria-label="`Переместить вариант ${index + 1} вниз`"
                  :disabled="
                    isDraftActionLocked || index === options.length - 1
                  "
                  class="modifier-group-editor__icon-action"
                  type="button"
                  variant="ghost"
                  @click="moveOption(index, 1)"
                  ><AdminIcon :icon="ChevronDown"
                /></AdminButton>
                <AdminButton
                  aria-label="Удалить вариант"
                  :disabled="isDraftActionLocked"
                  class="modifier-group-editor__icon-action"
                  type="button"
                  variant="destructive"
                  @click="openOptionRemoval(index)"
                  ><AdminIcon :icon="Trash2"
                /></AdminButton>
              </AdminActionGroup>
            </header>
            <ModifierOptionEditor
              :disabled="isDraftActionLocked"
              :field-errors="optionFieldErrors[index]"
              :model-value="option"
              @update:model-value="updateOption(index, $event)"
              @touch="touchOption(index, $event)"
            />
          </section>
          <AdminButton
            ref="addOptionButton"
            :disabled="isDraftActionLocked"
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
          v-if="shownDefaultError"
          :id="optionsErrorId"
          class="modifier-group-editor__error"
          role="alert"
        >
          {{ shownDefaultError }}
        </p>
      </fieldset>
      <section
        v-if="props.embedded && props.group !== null"
        class="modifier-group-editor__archive"
      >
        <AdminButton
          :disabled="isDraftActionLocked"
          type="button"
          variant="destructive"
          @click="openArchive"
        >
          Архивировать группу
        </AdminButton>
      </section>
      <section
        v-if="hasPendingMessage || (props.saveOutcome ?? 'idle') !== 'idle'"
        class="modifier-group-editor__feedback"
        role="status"
      >
        <p v-if="hasPendingMessage">
          {{ props.pendingMessage }}
        </p>
        <template v-else-if="props.saveOutcome === 'rejected'">
          {{
            props.operationKind === "archive"
              ? "Архивирование группы отклонено. Обновите меню, чтобы проверить её состояние."
              : "Исправьте отмеченные поля и сохраните группу снова."
          }}
        </template>
        <template v-else-if="props.saveOutcome === 'unconfirmed'">
          {{
            props.operationKind === "archive"
              ? "Не удалось подтвердить архивирование группы. Обновите меню, чтобы проверить её состояние."
              : "Не удалось подтвердить сохранение группы. Обновите меню, не повторяя сохранение."
          }}
        </template>
        <template v-else-if="props.saveOutcome === 'checked'">
          Меню обновлено. Закройте форму и проверьте группу.
        </template>
        <template v-else-if="props.saveOutcome === 'saved'"
          >Группа сохранена.</template
        >
        <p v-else-if="!hasPendingMessage && props.saveError">
          Не удалось сохранить изменения. Повторите попытку.
        </p>
        <AdminButton
          v-if="
            !hasPendingMessage &&
            (props.saveOutcome === 'unconfirmed' ||
              (props.operationKind === 'archive' &&
                props.saveOutcome === 'rejected'))
          "
          :disabled="props.disabled"
          type="button"
          variant="secondary"
          @click="emit('refresh')"
          >Обновить меню</AdminButton
        >
      </section>
    </form>
    <ConfirmDialog
      v-model:open="archiveOpen"
      confirm-label="Архивировать"
      confirm-variant="destructive"
      description="Группа добавок больше не будет доступна для назначения."
      title="Архивировать группу добавок?"
      @confirm="archive"
    />
    <ConfirmDialog
      v-model:open="optionRemovalOpen"
      confirm-label="Удалить"
      confirm-variant="destructive"
      description="Вариант будет исключён из группы добавок."
      title="Удалить вариант добавки?"
      @confirm="confirmOptionRemoval"
    />
  </section>
</template>

<script setup lang="ts">
import { Archive, ChevronDown, ChevronUp, Trash2, X } from "lucide-vue-next";
import {
  computed,
  nextTick,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminActionGroup from "../../../shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
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
  ModifierGroupFormField,
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
const hasPendingMessage = computed(
  () => props.pendingMessage !== null && props.pendingMessage !== undefined,
);
const name = shallowRef("");
const selectionType = shallowRef<"single" | "multiple">("single");
const minSelect = shallowRef("0");
const maxSelect = shallowRef("1");
const isActive = shallowRef(true);
const options = shallowRef<ModifierOptionDraft[]>([]);
const archiveOpen = shallowRef(false);
const groupTouched = shallowRef<
  ReadonlySet<"name" | "selectionType" | "minSelect" | "maxSelect" | "options">
>(new Set());
const submitAttempted = shallowRef(false);
const optionTouched = shallowRef<
  readonly ReadonlySet<ModifierOptionFormField>[]
>([]);
const dismissedServerFields = shallowRef<ReadonlySet<string>>(new Set());
const optionRemovalIndex = shallowRef<number | null>(null);
const optionRemovalOpen = shallowRef(false);
const restoreOptionFocus = shallowRef(false);
const optionFocusIndex = shallowRef<number | null>(null);
const optionRows = useTemplateRef<HTMLElement[]>("optionRows");
const addOptionButton =
  useTemplateRef<InstanceType<typeof AdminButton>>("addOptionButton");
const requiredControlId = `modifier-group-required-${useId()}`;
const activeControlId = `modifier-group-active-${useId()}`;
const nameInputId = `modifier-group-name-${useId()}`;
const selectionTypeId = `modifier-group-selection-type-${useId()}`;
const minSelectId = `modifier-group-min-select-${useId()}`;
const maxSelectId = `modifier-group-max-select-${useId()}`;
const optionsErrorId = `modifier-group-options-error-${useId()}`;
const isRequired = computed({
  get: () => Number(minSelect.value) > 0,
  set: (value: boolean) => {
    if (isDraftActionLocked.value) return;
    dismissServerField("options");
    updateGroupField("minSelect", value ? "1" : "0");
    if (value && Number(maxSelect.value) < 1) maxSelect.value = "1";
  },
});
const active = computed({
  get: () => isActive.value,
  set: (value: boolean) => {
    if (isDraftActionLocked.value) return;
    touchGroupField("options");
    isActive.value = value;
  },
});
const isDismissalLocked = computed(() => props.disabled);
const isDraftActionLocked = computed(
  () =>
    isDismissalLocked.value ||
    props.saveOutcome === "unconfirmed" ||
    props.saveOutcome === "checked" ||
    (props.operationKind === "archive" && props.saveOutcome !== "idle"),
);
const rawNameError = computed(() =>
  name.value.trim() ? undefined : "Введите название группы",
);
const rawMinSelectError = computed(() => {
  const min = Number(minSelect.value);
  const max = Number(maxSelect.value);
  if (!/^\d+$/.test(minSelect.value) || min > max)
    return "Минимум и максимум должны быть неотрицательными, минимум не больше максимума";
  return undefined;
});
const rawMaxSelectError = computed(() => {
  const min = Number(minSelect.value);
  const max = Number(maxSelect.value);
  if (!/^\d+$/.test(maxSelect.value) || min > max)
    return "Минимум и максимум должны быть неотрицательными, минимум не больше максимума";
  return undefined;
});
const rawSelectionTypeError = computed(() => {
  if (selectionType.value === "single" && Number(maxSelect.value) !== 1)
    return "Для одиночного выбора максимум должен быть равен одному";
  return undefined;
});
const rawDefaultError = computed(() => {
  if (!isActive.value) return undefined;
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
  return undefined;
});
const serverError = (field: ModifierGroupFormField) =>
  dismissedServerFields.value.has(field)
    ? undefined
    : props.fieldErrors?.[field];
const nameError = computed(() => rawNameError.value ?? serverError("name"));
const selectionError = computed(
  () =>
    rawSelectionTypeError.value ??
    rawMinSelectError.value ??
    rawMaxSelectError.value ??
    serverError("selectionType") ??
    serverError("minSelect") ??
    serverError("maxSelect"),
);
const defaultError = computed(
  () => rawDefaultError.value ?? serverError("options"),
);
const shownNameError = computed(
  () =>
    serverError("name") ??
    (groupTouched.value.has("name") || submitAttempted.value
      ? rawNameError.value
      : undefined),
);
const shownSelectionTypeError = computed(() => serverError("selectionType"));
const shownMinSelectError = computed(() =>
  limitError("minSelect", rawMinSelectError.value),
);
const shownMaxSelectError = computed(() =>
  limitError("maxSelect", rawMaxSelectError.value),
);
const shownDefaultError = computed(
  () =>
    serverError("options") ??
    (groupTouched.value.has("options") || submitAttempted.value
      ? rawDefaultError.value
      : undefined),
);
const optionFieldErrors = computed(() =>
  options.value.map((option, index) => {
    const errors: Partial<Record<ModifierOptionFormField, string>> = {};

    const touched = optionTouched.value[index] ?? new Set();
    if ((submitAttempted.value || touched.has("name")) && !option.name.trim())
      errors.name = "Введите название варианта";
    if (
      (submitAttempted.value || touched.has("priceDelta")) &&
      !isNonNegativeInteger(option.priceDelta)
    )
      errors.priceDelta = "Укажите изменение цены в целых рублях";
    for (const field of [
      "name",
      "priceDelta",
      "isDefault",
      "isAvailable",
    ] as const) {
      const error = serverError(
        `options.${index}.${field}` as ModifierGroupFormField,
      );
      if (error !== undefined) errors[field] = error;
    }

    return errors;
  }),
);
const hasOptionErrors = computed(() =>
  options.value.some(
    (option, index) =>
      !option.name.trim() ||
      !isNonNegativeInteger(option.priceDelta) ||
      Object.keys(optionFieldErrors.value[index] ?? {}).length > 0,
  ),
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
  groupTouched.value = new Set();
  submitAttempted.value = false;
  optionTouched.value = options.value.map(() => new Set());
  dismissedServerFields.value = new Set();
}
function save() {
  if (isDraftActionLocked.value) return;
  submitAttempted.value = true;
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
function openOptionRemoval(index: number): void {
  optionRemovalIndex.value = index;
  optionRemovalOpen.value = true;
}
function confirmOptionRemoval(): void {
  const index = optionRemovalIndex.value;
  if (index !== null) {
    optionFocusIndex.value =
      index < options.value.length - 1 ? index : index - 1;
    removeOption(index);
  }
  optionRemovalIndex.value = null;
  restoreOptionFocus.value = true;
}
function archive() {
  if (isDraftActionLocked.value || props.group === null) return;
  emit("archive", props.group.id);
  archiveOpen.value = false;
}
function openArchive() {
  if (isDraftActionLocked.value) return;
  archiveOpen.value = true;
}
function cancel() {
  if (isDismissalLocked.value) return;
  emit("cancel");
}
function addOption() {
  if (isDraftActionLocked.value) return;
  options.value = [...options.value, createEmptyModifierOptionDraft()];
  optionTouched.value = [...optionTouched.value, new Set()];
  dismissIndexedOptionErrors();
}
function updateOption(index: number, option: ModifierOptionDraft) {
  if (isDraftActionLocked.value) return;
  options.value = options.value.map((item, itemIndex) =>
    itemIndex === index ? option : item,
  );
}
function updateGroupField(
  field: "name" | "selectionType" | "minSelect" | "maxSelect",
  value: string,
) {
  if (isDraftActionLocked.value) return;
  touchGroupField(field);
  if (field === "minSelect" || field === "maxSelect") {
    touchGroupField("options");
  }
  dismissServerField(field);
  if (field === "name") name.value = value;
  else if (field === "selectionType")
    selectionType.value = value as "single" | "multiple";
  else if (field === "minSelect") minSelect.value = value;
  else maxSelect.value = value;
}
function touchOption(index: number, field: ModifierOptionFormField) {
  if (isDraftActionLocked.value) return;
  optionTouched.value = optionTouched.value.map((touched, itemIndex) =>
    itemIndex === index ? new Set([...touched, field]) : touched,
  );
  dismissServerField(`options.${index}.${field}`);
  if (field !== "name") {
    touchGroupField("options");
    dismissServerField("options");
  }
}
function touchGroupField(
  field: "name" | "selectionType" | "minSelect" | "maxSelect" | "options",
) {
  groupTouched.value = new Set([...groupTouched.value, field]);
}
function dismissServerField(field: string) {
  dismissedServerFields.value = new Set([
    ...dismissedServerFields.value,
    field,
  ]);
}
function dismissIndexedOptionErrors() {
  dismissedServerFields.value = new Set([
    ...dismissedServerFields.value,
    ...Object.keys(props.fieldErrors ?? {}).filter((field) =>
      field.startsWith("options."),
    ),
  ]);
  dismissServerField("options");
}
function limitError(
  field: "minSelect" | "maxSelect",
  rawFieldError: string | undefined,
) {
  const currentServerError = serverError(field);
  if (currentServerError !== undefined) return currentServerError;
  if (
    !groupTouched.value.has(field) &&
    !submitAttempted.value &&
    !(rawSelectionTypeError.value && groupTouched.value.has("selectionType"))
  )
    return undefined;

  return (
    [
      rawFieldError,
      field === "maxSelect" ? rawSelectionTypeError.value : undefined,
    ]
      .filter((error): error is string => error !== undefined)
      .join(" ") || undefined
  );
}
function removeOption(index: number) {
  if (isDraftActionLocked.value) return;
  touchGroupField("options");
  options.value = options.value.filter((_, itemIndex) => itemIndex !== index);
  optionTouched.value = optionTouched.value.filter(
    (_, itemIndex) => itemIndex !== index,
  );
  dismissIndexedOptionErrors();
}
function moveOption(index: number, offset: -1 | 1) {
  if (isDraftActionLocked.value) return;
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= options.value.length) return;
  const next = [...options.value];
  [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
  options.value = next;
  const touched = [...optionTouched.value];
  [touched[index], touched[targetIndex]] = [
    touched[targetIndex]!,
    touched[index]!,
  ];
  optionTouched.value = touched;
  dismissIndexedOptionErrors();
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
watch(() => props.group?.id, resetDraft, { immediate: true });
watch(
  () => props.fieldErrors,
  () => {
    dismissedServerFields.value = new Set();
  },
);
watch(optionRemovalOpen, (isOpen, wasOpen) => {
  if (isOpen || !wasOpen || !restoreOptionFocus.value) return;
  restoreOptionFocus.value = false;
  void nextTick(() => {
    globalThis.requestAnimationFrame(() => {
      const target = optionFocusIndex.value;
      optionFocusIndex.value = null;
      const input =
        target === null
          ? null
          : optionRows.value?.[target]?.querySelector<HTMLInputElement>(
              "input",
            );
      if (input) input.focus();
      else addOptionButton.value?.focus();
    });
  });
});
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
.modifier-group-editor__header {
  display: flex;
  align-items: center;
  gap: var(--expressa-space-sm);
}
@media (max-width: 767px) {
  .modifier-group-editor__header {
    flex-wrap: wrap;
  }
  .modifier-group-editor__header-actions {
    width: 100%;
    flex-wrap: nowrap;
  }
}
.modifier-group-editor__option,
.modifier-group-editor__option-header {
  display: grid;
  gap: var(--expressa-space-sm);
}
.modifier-group-editor__option {
  padding: var(--expressa-space-md) 0;
}
.modifier-group-editor__option + .modifier-group-editor__option {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.modifier-group-editor__option-header {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}
.modifier-group-editor__option-header h3 {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-action);
}
.modifier-group-editor__header {
  justify-content: space-between;
}
.modifier-group-editor__header-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.modifier-group-editor__icon-action {
  width: var(--expressa-size-control-min-height);
  min-width: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
  padding: 0;
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
.modifier-group-editor__limits {
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
