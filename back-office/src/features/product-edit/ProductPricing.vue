<template>
  <fieldset ref="pricing" class="product-pricing">
    <legend>Цена</legend>
    <div class="product-pricing__modes">
      <label
        ><input
          id="product-mode"
          type="radio"
          name="product-pricing"
          value="single"
          :checked="single"
          :disabled="controlsDisabled"
          @change="emit('mode', 'single')"
        />Одна цена</label
      >
      <label
        ><input
          type="radio"
          name="product-pricing"
          value="choices"
          :checked="!single"
          :disabled="controlsDisabled"
          @change="emit('mode', 'choices')"
        />Ценовые опции</label
      >
    </div>
    <div v-if="single" class="product-pricing__single">
      <UiTextField
        id="product-price"
        label="Цена, ₽"
        type="number"
        min="0"
        max="2147483647"
        step="1"
        :model-value="draft.price"
        :error="errors.fields.price"
        :read-only="readOnly"
        :disabled="disabled"
        @update:model-value="singleField('price', $event)"
      />
      <UiTextField
        id="product-portionLabel"
        label="Название порции (необязательно)"
        :model-value="draft.portionLabel"
        :error="errors.fields.portionLabel"
        :read-only="readOnly"
        :disabled="disabled"
        @update:model-value="singleField('portionLabel', $event)"
      />
    </div>
    <ProductChoices
      v-else
      :choices="draft.choices"
      :errors="errors.choices"
      :disabled="controlsDisabled"
      @field="choiceField"
      @add="emit('addChoice')"
      @remove="emit('removeChoice', $event)"
      @move="(key, direction) => emit('moveChoice', key, direction)"
    />
    <div v-if="omissions.length" class="product-pricing__omissions">
      <h3>Опции к архивированию</h3>
      <ul>
        <li v-for="choice in omissions" :key="choice.key">
          <span>{{ choice.originalLabel }}</span>
          <UiButton
            v-if="removedKeys.has(choice.key)"
            variant="quiet"
            :disabled="controlsDisabled"
            :aria-label="`Вернуть опцию ${choice.originalLabel}`"
            @activate="restoreChoice(choice.key)"
            >Вернуть</UiButton
          >
        </li>
      </ul>
    </div>
    <p v-if="errors.fields.mode" class="product-pricing__error">
      {{ errors.fields.mode }}
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import { copyProductDraft } from "../../entities/catalog/product.mapper";
import { computed, nextTick, ref } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import ProductChoices from "./ProductChoices.vue";
import type { ProductChoiceField } from "../../entities/catalog/catalog.types";
import type {
  ProductPricingProps,
  ProductPricingEmits,
} from "./ProductPricing.types";

const props = defineProps<ProductPricingProps>();
const emit = defineEmits<ProductPricingEmits>();
const pricing = ref<HTMLElement | null>(null);
const single = computed(() => props.draft.mode === "single");
const controlsDisabled = computed(() => props.disabled || props.readOnly);
const removedKeys = computed(
  () => new Set(props.draft.removed.map((choice) => choice.key)),
);
const omissions = computed(() =>
  (single.value
    ? [
        ...props.draft.choices.filter((choice) => choice.id !== null),
        ...props.draft.removed,
      ]
    : props.draft.removed
  ).map((choice) => ({
    ...choice,
    originalLabel: props.baselineChoices.find((item) => item.id === choice.id)
      ?.portionLabel,
  })),
);

function singleField(field: "price" | "portionLabel", value: string) {
  emit("draft", { ...copyProductDraft(props.draft), [field]: value });
}

async function restoreChoice(key: number) {
  const choice = props.draft.removed.find((item) => item.key === key);
  const baseline = props.baselineChoices;
  const mode = props.draft.mode;
  const origin = document.activeElement;

  if (choice === undefined || controlsDisabled.value) return;
  emit("restoreChoice", key);
  await nextTick();
  if (
    !pricing.value?.isConnected ||
    controlsDisabled.value ||
    props.baselineChoices !== baseline ||
    props.draft.mode !== mode ||
    !props.draft.choices.some(
      (item) => item.key === key && item.id === choice.id,
    ) ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;

  pricing.value
    .querySelector<HTMLElement>(
      mode === "choices" ? `#choice-${key}-portionLabel` : "#product-price",
    )
    ?.focus();
}

function choiceField(
  key: number,
  field: ProductChoiceField,
  value: string | boolean,
) {
  const choices = props.draft.choices.map((choice) => {
    if (choice.key !== key) return { ...choice };
    if (field === "isAvailable" && typeof value === "boolean")
      return { ...choice, isAvailable: value };
    if (field !== "isAvailable" && typeof value === "string")
      return { ...choice, [field]: value };

    return { ...choice };
  });

  emit("draft", { ...copyProductDraft(props.draft), choices });
}
</script>

<style scoped>
.product-pricing {
  display: grid;
  gap: var(--space-lg);
  min-inline-size: 0;
  border: 0;
  padding: 0;
  margin: 0;
}
.product-pricing legend {
  font-weight: var(--weight-label);
  margin-block-end: var(--space-md);
}
.product-pricing__modes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}
.product-pricing__modes label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  min-block-size: var(--control-height);
}
.product-pricing__modes input {
  accent-color: var(--color-primary);
}
.product-pricing__single,
.product-pricing__omissions {
  display: grid;
  gap: var(--space-lg);
}
.product-pricing__omissions ul {
  padding-inline-start: var(--space-lg);
  margin: 0;
}
.product-pricing__omissions li {
  overflow-wrap: anywhere;
}
.product-pricing__error {
  color: var(--color-danger);
}
</style>
