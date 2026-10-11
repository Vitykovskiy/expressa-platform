<template>
  <form class="product-form" novalidate @submit.prevent="emit('save')">
    <header>
      <h2
        id="product-form-heading"
        class="foundation-section-title"
        tabindex="-1"
      >
        {{ title }}
      </h2>
      <p v-if="categoryName" class="product-form__context">
        {{ categoryName }}
      </p>
    </header>
    <UiTextField
      id="product-name"
      label="Название"
      :model-value="draft.name"
      :error="errors.fields.name"
      :read-only="readOnly"
      :disabled="disabled"
      @update:model-value="text('name', $event)"
    />
    <div id="product-categoryId" tabindex="-1">
      <UiSelect
        label="Категория"
        :model-value="draft.categoryId || null"
        :options="categoryOptions"
        :error="errors.fields.categoryId"
        :disabled="choiceDisabled"
        @update:model-value="text('categoryId', $event ?? '')"
      />
    </div>
    <div class="product-form__description">
      <label for="product-description">Описание</label>
      <textarea
        id="product-description"
        rows="5"
        :value="draft.description"
        :readonly="readOnly"
        :disabled="disabled"
        :aria-invalid="Boolean(errors.fields.description)"
        :aria-describedby="
          errors.fields.description ? 'product-description-error' : undefined
        "
        @input="description"
      />
      <p
        v-if="errors.fields.description"
        id="product-description-error"
        class="product-form__error"
      >
        {{ errors.fields.description }}
      </p>
    </div>
    <UiTextField
      id="product-sortOrder"
      label="Порядок"
      type="number"
      min="0"
      max="2147483647"
      step="1"
      :model-value="draft.sortOrder"
      :error="errors.fields.sortOrder"
      :read-only="readOnly"
      :disabled="disabled"
      @update:model-value="text('sortOrder', $event)"
    />
    <div>
      <UiCheckbox
        id="product-isActive"
        label="Товар активен"
        :model-value="draft.isActive"
        :disabled="choiceDisabled"
        :aria-invalid="Boolean(errors.fields.isActive)"
        :aria-describedby="
          errors.fields.isActive ? 'product-active-error' : undefined
        "
        @update:model-value="flag('isActive', $event)"
      />
      <p
        v-if="errors.fields.isActive"
        id="product-active-error"
        class="product-form__error"
      >
        {{ errors.fields.isActive }}
      </p>
    </div>
    <div>
      <UiCheckbox
        id="product-isAvailable"
        label="Доступность товара"
        :model-value="draft.isAvailable"
        :disabled="choiceDisabled"
        :aria-invalid="Boolean(errors.fields.isAvailable)"
        :aria-describedby="
          errors.fields.isAvailable ? 'product-available-error' : undefined
        "
        @update:model-value="flag('isAvailable', $event)"
      />
      <p
        v-if="errors.fields.isAvailable"
        id="product-available-error"
        class="product-form__error"
      >
        {{ errors.fields.isAvailable }}
      </p>
    </div>
    <ProductPricing
      :draft="draft"
      :baseline-choices="baselineChoices"
      :errors="errors"
      :read-only="readOnly"
      :disabled="disabled"
      @draft="emit('draft', $event)"
      @mode="emit('mode', $event)"
      @add-choice="emit('addChoice')"
      @remove-choice="emit('removeChoice', $event)"
      @restore-choice="emit('restoreChoice', $event)"
      @move-choice="(key, direction) => emit('moveChoice', key, direction)"
    />
    <p
      v-if="errors.form"
      id="product-form-error"
      class="product-form__error"
      tabindex="-1"
      role="alert"
    >
      {{ errors.form }}
    </p>
    <div v-if="showActions" class="ui-actions">
      <UiButton
        id="product-save"
        type="submit"
        :disabled="saveDisabled"
        :loading="busy"
        >{{ creating ? "Создать товар" : "Сохранить изменения" }}</UiButton
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
      class="product-form__archive"
      @activate="emit('archive')"
      >Архивировать товар</UiButton
    >
  </form>
</template>

<script setup lang="ts">
import { copyProductDraft } from "../../entities/catalog/product.mapper";
import { computed, nextTick, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiCheckbox from "../../shared/ui/UiCheckbox/UiCheckbox.vue";
import UiSelect from "../../shared/ui/UiSelect/UiSelect.vue";
import ProductPricing from "./ProductPricing.vue";
import type { ProductFormProps, ProductFormEmits } from "./ProductForm.types";

const props = defineProps<ProductFormProps>();
const emit = defineEmits<ProductFormEmits>();
const choiceDisabled = computed(() => props.disabled || props.readOnly);
const showActions = computed(() => !props.readOnly || props.attempting);
const saveDisabled = computed(
  () =>
    choiceDisabled.value ||
    props.mutationDisabled ||
    props.confirming ||
    (!props.creating && !props.dirty),
);
const categoryOptions = computed(() =>
  props.categories.map((item) => ({
    value: item.id,
    label: `${item.name}${item.isActive ? "" : " · Неактивна"} · Порядок ${item.sortOrder}`,
  })),
);

function text(
  field: "name" | "description" | "categoryId" | "sortOrder",
  value: string,
) {
  emit("draft", { ...copyProductDraft(props.draft), [field]: value });
}

function flag(field: "isActive" | "isAvailable", value: boolean) {
  emit("draft", { ...copyProductDraft(props.draft), [field]: value });
}

function description(event: Event) {
  if (event.target instanceof HTMLTextAreaElement)
    text("description", event.target.value);
}

watch(
  () => props.readOnly,
  (readOnly) => {
    if (readOnly && document.activeElement?.closest(".product-form"))
      document.getElementById("product-form-heading")?.focus();
  },
  { flush: "sync" },
);
watch(
  () => props.errors,
  async () => {
    if (!document.activeElement?.closest(".product-form")) return;

    await nextTick();
    if (!document.activeElement?.closest(".product-form")) return;

    const field = Object.keys(props.errors.fields)[0];
    const key = props.draft.choices.find(
      (choice) => props.errors.choices[choice.key] !== undefined,
    )?.key;
    const nested =
      key === undefined
        ? undefined
        : Object.keys(props.errors.choices[key]!)[0];
    const id = field
      ? `product-${field}`
      : key !== undefined
        ? `choice-${key}-${nested}`
        : props.errors.form
          ? "product-form-error"
          : null;

    if (id !== null) {
      const control = document.getElementById(id);

      (id === "product-categoryId"
        ? control?.querySelector("input")
        : control
      )?.focus();
    }
  },
);
</script>

<style scoped>
.product-form {
  display: grid;
  align-content: start;
  gap: var(--space-xl);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.product-form__context {
  color: var(--color-foreground-muted);
  margin-block-start: var(--space-sm);
}
.product-form__description {
  display: grid;
  gap: var(--space-sm);
  font-weight: var(--weight-label);
}
.product-form__description textarea {
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
.product-form__description textarea[aria-invalid="true"] {
  border-color: var(--color-danger);
}
.product-form__description textarea:read-only,
.product-form__description textarea:disabled {
  background: var(--color-surface-muted);
  color: var(--color-foreground-muted);
}
.product-form__error,
.product-form__archive {
  color: var(--color-danger);
}
.product-form__error {
  font-weight: var(--weight-body);
  font-size: var(--font-data);
}
</style>
