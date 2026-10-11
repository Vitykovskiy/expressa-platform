<template>
  <form class="modifier-form" novalidate @submit.prevent="emit('save')">
    <h2
      id="modifier-form-heading"
      class="foundation-section-title"
      tabindex="-1"
    >
      {{ title }}
    </h2>
    <UiTextField
      id="modifier-name"
      name="modifier-name"
      autocomplete="off"
      label="Название группы"
      :model-value="draft.name"
      :error="errors.fields.name"
      :read-only="readOnly"
      :disabled="disabled || confirming"
      @update:model-value="text('name', $event)"
      @blur="validate({ kind: 'field', field: 'name' })"
    />
    <fieldset
      id="modifier-selectionType"
      tabindex="-1"
      :disabled="choiceDisabled"
      :aria-invalid="Boolean(errors.fields.selectionType)"
      :aria-describedby="
        errors.fields.selectionType ? 'modifier-type-error' : undefined
      "
    >
      <legend>Тип выбора</legend>
      <label
        ><input
          type="radio"
          name="modifier-selectionType"
          value="single"
          :checked="draft.selectionType === 'single'"
          @change="text('selectionType', 'single')"
          @blur="validate({ kind: 'field', field: 'selectionType' })"
        />
        Один вариант</label
      >
      <label
        ><input
          type="radio"
          name="modifier-selectionType"
          value="multiple"
          :checked="draft.selectionType === 'multiple'"
          @change="text('selectionType', 'multiple')"
          @blur="validate({ kind: 'field', field: 'selectionType' })"
        />
        Несколько вариантов</label
      >
      <p
        v-if="errors.fields.selectionType"
        id="modifier-type-error"
        class="modifier-form__error"
      >
        {{ errors.fields.selectionType }}
      </p>
    </fieldset>
    <div class="modifier-form__numbers">
      <UiTextField
        v-for="item in modifierNumericFields"
        :id="`modifier-${item.field}`"
        :key="item.field"
        :name="`modifier-${item.field}`"
        autocomplete="off"
        inputmode="numeric"
        :label="item.label"
        type="number"
        min="0"
        max="2147483647"
        step="1"
        :model-value="draft[item.field]"
        :error="errors.fields[item.field]"
        :read-only="readOnly"
        :disabled="disabled || confirming"
        @update:model-value="text(item.field, $event)"
        @blur="validate({ kind: 'field', field: item.field })"
      />
    </div>
    <div>
      <UiCheckbox
        id="modifier-isActive"
        name="modifier-isActive"
        label="Группа активна"
        :model-value="draft.isActive"
        :disabled="choiceDisabled"
        :aria-invalid="Boolean(errors.fields.isActive)"
        :aria-describedby="
          errors.fields.isActive ? 'modifier-active-error' : undefined
        "
        @update:model-value="flag($event)"
        @blur="validate({ kind: 'field', field: 'isActive' })"
      />
      <p
        v-if="errors.fields.isActive"
        id="modifier-active-error"
        class="modifier-form__error"
      >
        {{ errors.fields.isActive }}
      </p>
    </div>
    <section
      class="modifier-form__options"
      aria-labelledby="modifier-options-heading"
      :aria-describedby="
        errors.optionsMessage ? 'modifier-options-error' : undefined
      "
    >
      <h3
        id="modifier-options-heading"
        tabindex="-1"
        :aria-describedby="
          errors.optionsMessage ? 'modifier-options-error' : undefined
        "
      >
        Добавки
      </h3>
      <p
        v-if="errors.optionsMessage"
        id="modifier-options-error"
        class="modifier-form__error"
        role="alert"
      >
        {{ errors.optionsMessage }}
      </p>
      <div
        v-for="(option, index) in draft.options"
        :id="`modifier-option-${option.key}`"
        :key="option.key"
        class="modifier-form__option"
        tabindex="-1"
      >
        <h4>{{ option.name || `Добавка ${index + 1}` }}</h4>
        <p
          v-if="errors.options[option.key]?.row"
          :id="`modifier-option-${option.key}-row`"
          class="modifier-form__error"
          tabindex="-1"
        >
          {{ errors.options[option.key]?.row }}
        </p>
        <UiTextField
          :id="`modifier-option-${option.key}-name`"
          :name="`modifier-option-${option.key}-name`"
          autocomplete="off"
          label="Название добавки"
          :model-value="option.name"
          :error="errors.options[option.key]?.name"
          :read-only="readOnly"
          :disabled="disabled || confirming"
          @update:model-value="optionText(option.key, 'name', $event)"
          @blur="validate({ kind: 'option', key: option.key, field: 'name' })"
        />
        <div class="modifier-form__numbers">
          <UiTextField
            v-for="item in modifierOptionNumericFields"
            :id="`modifier-option-${option.key}-${item.field}`"
            :key="item.field"
            :name="`modifier-option-${option.key}-${item.field}`"
            autocomplete="off"
            inputmode="numeric"
            :label="item.label"
            type="number"
            min="0"
            max="2147483647"
            step="1"
            :model-value="option[item.field]"
            :error="errors.options[option.key]?.[item.field]"
            :read-only="readOnly"
            :disabled="disabled || confirming"
            @update:model-value="optionText(option.key, item.field, $event)"
            @blur="
              validate({ kind: 'option', key: option.key, field: item.field })
            "
          />
        </div>
        <div v-for="item in modifierOptionFlags" :key="item.field">
          <UiCheckbox
            :id="`modifier-option-${option.key}-${item.field}`"
            :name="`modifier-option-${option.key}-${item.field}`"
            :label="item.label"
            :model-value="option[item.field]"
            :disabled="choiceDisabled"
            :aria-invalid="Boolean(errors.options[option.key]?.[item.field])"
            :aria-describedby="
              errors.options[option.key]?.[item.field]
                ? `modifier-option-${option.key}-${item.field}-error`
                : undefined
            "
            @update:model-value="optionFlag(option.key, item.field, $event)"
            @blur="
              validate({ kind: 'option', key: option.key, field: item.field })
            "
          />
          <p
            v-if="errors.options[option.key]?.[item.field]"
            :id="`modifier-option-${option.key}-${item.field}-error`"
            class="modifier-form__error"
          >
            {{ errors.options[option.key]?.[item.field] }}
          </p>
        </div>
        <div class="ui-actions">
          <UiButton
            :id="`modifier-option-${option.key}-up`"
            variant="quiet"
            :aria-label="`Выше: ${option.name || `добавка ${index + 1}`}`"
            :disabled="choiceDisabled || !validOrders || index === 0"
            @activate="move(option.key, -1)"
            >Выше</UiButton
          >
          <UiButton
            :id="`modifier-option-${option.key}-down`"
            variant="quiet"
            :aria-label="`Ниже: ${option.name || `добавка ${index + 1}`}`"
            :disabled="
              choiceDisabled ||
              !validOrders ||
              index === draft.options.length - 1
            "
            @activate="move(option.key, 1)"
            >Ниже</UiButton
          >
          <UiButton
            variant="quiet"
            :disabled="choiceDisabled"
            :aria-label="`Исключить: ${option.name || `добавка ${index + 1}`}`"
            @activate="remove(option.key)"
            >Исключить</UiButton
          >
        </div>
      </div>
      <UiButton
        id="modifier-option-add"
        variant="secondary"
        :disabled="choiceDisabled"
        @activate="add"
        >Добавить добавку</UiButton
      >
      <div
        v-for="option in draft.removed"
        :key="option.key"
        class="modifier-form__removed"
      >
        <span>{{ option.name }}</span>
        <UiButton
          variant="quiet"
          :disabled="choiceDisabled"
          :aria-label="`Вернуть: ${option.name}`"
          @activate="restore(option.key)"
          >Вернуть</UiButton
        >
      </div>
    </section>
    <p v-if="announcement" role="status" aria-atomic="true">
      {{ announcement }}
    </p>
    <p
      v-if="errors.form"
      id="modifier-form-error"
      class="modifier-form__error"
      role="alert"
      tabindex="-1"
    >
      {{ errors.form }}
    </p>
    <div v-if="!readOnly || attempting" class="ui-actions">
      <UiButton
        id="modifier-save"
        type="submit"
        :disabled="choiceDisabled || mutationDisabled || (!creating && !dirty)"
        :loading="busy"
        >{{ creating ? "Создать группу" : "Сохранить изменения" }}</UiButton
      >
      <UiButton
        variant="secondary"
        :disabled="choiceDisabled"
        @activate="emit('cancel')"
        >Отменить изменения</UiButton
      >
    </div>
    <UiButton
      v-if="canArchive"
      variant="quiet"
      class="modifier-form__archive"
      :disabled="choiceDisabled"
      @activate="emit('archive')"
      >Архивировать группу</UiButton
    >
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import {
  copyModifierDraft,
  validModifierOrders,
} from "../../entities/catalog/modifier.mapper";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiCheckbox from "../../shared/ui/UiCheckbox/UiCheckbox.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import {
  modifierNumericFields,
  modifierOptionNumericFields,
  modifierOptionFlags,
} from "./ModifierForm.constants";
import type {
  ModifierFormProps,
  ModifierFormEmits,
} from "./ModifierForm.types";
import type { ModifierValidationTarget } from "../../entities/catalog/catalog.types";

const props = defineProps<ModifierFormProps>();
const emit = defineEmits<ModifierFormEmits>();
const choiceDisabled = computed(
  () => props.disabled || props.readOnly || props.confirming || !props.active,
);
const validOrders = computed(() => validModifierOrders(props.draft.options));
const announcement = ref("");
let mounted = true;

onUnmounted(() => {
  mounted = false;
});

async function validate(target: ModifierValidationTarget) {
  const task = props.task;

  if (choiceDisabled.value) return;
  await nextTick();
  if (!mounted || props.task !== task || choiceDisabled.value) return;
  emit("validate", target, task, props.revision);
}

function text(
  field: "name" | "minSelect" | "maxSelect" | "selectionType",
  value: string,
) {
  if (field === "selectionType" && value !== "single" && value !== "multiple")
    return;
  emit("draft", { ...copyModifierDraft(props.draft), [field]: value });
}

function flag(value: boolean) {
  emit("draft", { ...copyModifierDraft(props.draft), isActive: value });
}

function optionText(
  key: number,
  field: "name" | "priceDelta" | "sortOrder",
  value: string,
) {
  const draft = copyModifierDraft(props.draft);
  const option = draft.options.find((item) => item.key === key);

  if (option === undefined) return;
  option[field] = value;
  emit("draft", draft);
}

function optionFlag(
  key: number,
  field: "isDefault" | "isAvailable",
  value: boolean,
) {
  const draft = copyModifierDraft(props.draft);
  const option = draft.options.find((item) => item.key === key);

  if (option === undefined) return;
  option[field] = value;
  emit("draft", draft);
}

async function focusAfter(
  id: string,
  origin: Element | null,
  revision: number,
  changed: boolean,
) {
  const task = props.task;

  await nextTick();
  if (
    !mounted ||
    props.task !== task ||
    !props.active ||
    choiceDisabled.value ||
    props.revision !== revision + (changed ? 1 : 0) ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;
  const target = document.getElementById(id);

  (target?.matches(":disabled")
    ? target.closest<HTMLElement>(".modifier-form__option")
    : target
  )?.focus({ preventScroll: true });
}

function add() {
  const origin = document.activeElement;
  const revision = props.revision;
  const task = props.task;

  emit("add");
  void nextTick().then(() => {
    if (!mounted || props.task !== task || props.revision !== revision + 1)
      return;
    const option = props.draft.options.at(-1);

    if (option !== undefined)
      void focusAfter(
        `modifier-option-${option.key}-name`,
        origin,
        revision,
        true,
      );
  });
}

function restore(key: number) {
  const origin = document.activeElement;
  const revision = props.revision;

  emit("restore", key);
  void focusAfter(`modifier-option-${key}-name`, origin, revision, true);
}

function remove(key: number) {
  const index = props.draft.options.findIndex((item) => item.key === key);
  const neighbor =
    props.draft.options[index + 1] ?? props.draft.options[index - 1];
  const origin = document.activeElement;
  const revision = props.revision;

  emit("remove", key);
  void focusAfter(
    neighbor ? `modifier-option-${neighbor.key}-name` : "modifier-option-add",
    origin,
    revision,
    true,
  );
}

async function move(key: number, direction: -1 | 1) {
  const origin = document.activeElement;
  const revision = props.revision;

  emit("move", key, direction);
  await focusAfter(
    `modifier-option-${key}-${direction === -1 ? "up" : "down"}`,
    origin,
    revision,
    true,
  );
  if (!props.active || props.revision !== revision + 1 || props.confirming)
    return;
  const index = props.draft.options.findIndex((item) => item.key === key);

  announcement.value = `Добавка ${index + 1} из ${props.draft.options.length}`;
}

watch(
  () => props.readOnly,
  (value) => {
    if (
      value &&
      props.active &&
      document.activeElement?.closest(".modifier-form")
    )
      document
        .getElementById("modifier-form-heading")
        ?.focus({ preventScroll: true });
  },
  { flush: "sync" },
);
watch(
  () => props.errorFocus,
  async (request) => {
    if (request === null || request.revision !== props.revision) return;
    const errors = props.errors;
    const origin = document.activeElement;
    const revision = props.revision;
    const field = Object.keys(errors.fields)[0];
    const option = props.draft.options.find((item) => errors.options[item.key]);
    const nested = option
      ? Object.keys(errors.options[option.key]!)[0]
      : undefined;
    const id = field
      ? `modifier-${field}`
      : option
        ? `modifier-option-${option.key}-${nested}`
        : errors.optionsMessage
          ? "modifier-options-heading"
          : errors.form
            ? "modifier-form-error"
            : null;

    if (id !== null && origin?.closest(".modifier-form"))
      await focusAfter(id, origin, revision, false);
  },
);
</script>

<style scoped>
.modifier-form,
.modifier-form__options,
.modifier-form__option {
  display: grid;
  align-content: start;
  gap: var(--space-lg);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.modifier-form {
  gap: var(--space-xl);
}
.modifier-form fieldset {
  display: grid;
  gap: var(--space-md);
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.modifier-form legend {
  margin-block-end: var(--space-md);
  font-weight: var(--weight-label);
}
.modifier-form fieldset label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-block-size: var(--control-height);
  cursor: pointer;
}
.modifier-form input[type="radio"] {
  accent-color: var(--color-primary);
  inline-size: var(--icon-size);
  block-size: var(--icon-size);
}
.modifier-form__numbers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
}
.modifier-form__option {
  border-block-start: var(--border-width) solid var(--color-border);
  padding-block-start: var(--space-lg);
}
.modifier-form__removed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}
.modifier-form__error,
.modifier-form__archive {
  color: var(--color-danger);
}
.modifier-form__error {
  font-size: var(--font-data);
}
@media (max-width: 37.5rem) {
  .modifier-form__numbers {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
