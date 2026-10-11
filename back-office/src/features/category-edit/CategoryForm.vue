<template>
  <form class="category-form" novalidate @submit.prevent="emit('save')">
    <h2
      id="category-form-heading"
      tabindex="-1"
      class="foundation-section-title"
    >
      {{ title }}
    </h2>
    <UiTextField
      id="category-name"
      :model-value="draft.name"
      label="Название"
      :read-only="readOnly"
      :disabled="disabled"
      :error="errors.name"
      @update:model-value="updateText('name', $event)"
    />
    <div class="category-form__description">
      <label for="category-description">Описание</label>
      <textarea
        id="category-description"
        :value="draft.description"
        :readonly="readOnly"
        :disabled="disabled"
        :aria-invalid="Boolean(errors.description)"
        :aria-describedby="
          errors.description ? 'category-description-error' : undefined
        "
        rows="5"
        @input="updateDescription"
      />
      <p
        v-if="errors.description"
        id="category-description-error"
        class="category-form__error"
      >
        {{ errors.description }}
      </p>
    </div>
    <UiTextField
      id="category-order"
      :model-value="draft.sortOrder"
      label="Порядок"
      type="number"
      min="0"
      max="2147483647"
      step="1"
      :read-only="readOnly"
      :disabled="disabled"
      :error="errors.sortOrder"
      @update:model-value="updateText('sortOrder', $event)"
    />
    <div>
      <UiCheckbox
        id="category-active"
        :model-value="draft.isActive"
        label="Категория активна"
        :disabled="checkboxDisabled"
        :aria-invalid="Boolean(errors.isActive)"
        :aria-describedby="
          errors.isActive ? 'category-active-error' : undefined
        "
        @update:model-value="emit('draft', { ...draft, isActive: $event })"
      />
      <p
        v-if="errors.isActive"
        id="category-active-error"
        class="category-form__error"
      >
        {{ errors.isActive }}
      </p>
    </div>
    <div v-if="!readOnly || attempting" class="ui-actions">
      <UiButton type="submit" :disabled="saveDisabled" :loading="busy">{{
        creating ? "Создать категорию" : "Сохранить изменения"
      }}</UiButton>
      <UiButton
        variant="secondary"
        :disabled="disabled || readOnly"
        @activate="emit('cancel')"
        >Отменить изменения</UiButton
      >
    </div>
    <UiButton
      v-if="canArchive"
      variant="quiet"
      class="category-form__archive"
      @activate="emit('archive')"
      >Архивировать категорию</UiButton
    >
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiCheckbox from "../../shared/ui/UiCheckbox/UiCheckbox.vue";
import type {
  CategoryFormEmits,
  CategoryFormProps,
} from "./CategoryForm.types";

const props = defineProps<CategoryFormProps>();
const emit = defineEmits<CategoryFormEmits>();
const checkboxDisabled = computed(() => props.disabled || props.readOnly);
const saveDisabled = computed(
  () =>
    props.disabled ||
    props.readOnly ||
    props.mutationDisabled ||
    (!props.creating && !props.dirty),
);

function updateText(
  field: "name" | "description" | "sortOrder",
  value: string,
) {
  emit("draft", { ...props.draft, [field]: value });
}

function updateDescription(event: Event) {
  if (event.target instanceof HTMLTextAreaElement)
    updateText("description", event.target.value);
}

watch(
  () => props.readOnly,
  (readOnly) => {
    if (readOnly && document.activeElement?.closest(".category-form"))
      document.getElementById("category-form-heading")?.focus();
  },
  { flush: "sync" },
);

watch(
  () => props.errors,
  async (errors) => {
    if (!document.activeElement?.closest(".category-form")) return;

    await nextTick();
    if (!document.activeElement?.closest(".category-form")) return;

    const field = errors.name
      ? "category-name"
      : errors.description
        ? "category-description"
        : errors.sortOrder
          ? "category-order"
          : errors.isActive
            ? "category-active"
            : null;

    if (field !== null) document.getElementById(field)?.focus();
  },
);
</script>

<style scoped>
.category-form {
  display: grid;
  align-content: start;
  gap: var(--space-xl);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.category-form__description {
  display: grid;
  gap: var(--space-sm);
  font-weight: var(--weight-label);
}
.category-form__description textarea {
  inline-size: 100%;
  min-inline-size: 0;
  min-block-size: var(--control-height);
  padding: var(--space-md) var(--space-lg);
  border: var(--border-width) solid var(--color-control-border);
  border-radius: var(--field-radius);
  background: var(--color-surface);
  color: var(--color-foreground);
  font-size: var(--font-body);
  font-weight: var(--weight-body);
  line-height: var(--line-body);
  resize: vertical;
}
.category-form__description textarea[aria-invalid="true"] {
  border-color: var(--color-danger);
}
.category-form__description textarea:read-only,
.category-form__description textarea:disabled {
  background: var(--color-surface-muted);
  color: var(--color-foreground-muted);
}
.category-form__error,
.category-form__archive {
  color: var(--color-danger);
}
.category-form__error {
  font-weight: var(--weight-body);
  font-size: var(--font-data);
}
</style>
