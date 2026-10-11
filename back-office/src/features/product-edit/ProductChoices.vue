<template>
  <div class="product-choices">
    <fieldset
      v-for="(choice, index) in choices"
      :id="`choice-${choice.key}-row`"
      :key="choice.key"
      class="product-choices__row"
      tabindex="-1"
      :aria-describedby="
        errors[choice.key]?.row ? `choice-${choice.key}-error` : undefined
      "
    >
      <legend>Опция {{ index + 1 }}</legend>
      <UiTextField
        :id="`choice-${choice.key}-portionLabel`"
        label="Название порции"
        :model-value="choice.portionLabel"
        :error="errors[choice.key]?.portionLabel"
        :disabled="disabled"
        @update:model-value="emit('field', choice.key, 'portionLabel', $event)"
      />
      <UiTextField
        :id="`choice-${choice.key}-price`"
        label="Цена, ₽"
        type="number"
        min="0"
        max="2147483647"
        step="1"
        :model-value="choice.price"
        :error="errors[choice.key]?.price"
        :disabled="disabled"
        @update:model-value="emit('field', choice.key, 'price', $event)"
      />
      <UiTextField
        :id="`choice-${choice.key}-sortOrder`"
        label="Порядок"
        type="number"
        min="0"
        max="2147483647"
        step="1"
        :model-value="choice.sortOrder"
        :error="errors[choice.key]?.sortOrder"
        :disabled="disabled"
        @update:model-value="emit('field', choice.key, 'sortOrder', $event)"
      />
      <div>
        <UiCheckbox
          :id="`choice-${choice.key}-isAvailable`"
          label="Доступность опции"
          :model-value="choice.isAvailable"
          :disabled="disabled"
          :aria-invalid="Boolean(errors[choice.key]?.isAvailable)"
          :aria-describedby="
            errors[choice.key]?.isAvailable
              ? `choice-${choice.key}-available-error`
              : undefined
          "
          @update:model-value="emit('field', choice.key, 'isAvailable', $event)"
        />
        <p
          v-if="errors[choice.key]?.isAvailable"
          :id="`choice-${choice.key}-available-error`"
          class="product-choices__error"
        >
          {{ errors[choice.key]?.isAvailable }}
        </p>
      </div>
      <p
        v-if="errors[choice.key]?.row"
        :id="`choice-${choice.key}-error`"
        class="product-choices__error"
      >
        {{ errors[choice.key]?.row }}
      </p>
      <div class="ui-actions">
        <UiButton
          :id="`choice-up-${choice.key}`"
          variant="quiet"
          :disabled="disabled || !movable || index === 0"
          :aria-label="`Выше: опция ${index + 1}, ${choice.portionLabel}`"
          @activate="move(choice.key, -1)"
          >Выше</UiButton
        >
        <UiButton
          :id="`choice-down-${choice.key}`"
          variant="quiet"
          :disabled="disabled || !movable || index === choices.length - 1"
          :aria-label="`Ниже: опция ${index + 1}, ${choice.portionLabel}`"
          @activate="move(choice.key, 1)"
          >Ниже</UiButton
        >
        <UiButton
          variant="quiet"
          :disabled="disabled"
          :aria-label="`Удалить опцию ${index + 1}, ${choice.portionLabel}`"
          @activate="remove(choice.key)"
          >Удалить</UiButton
        >
      </div>
    </fieldset>
    <p v-if="announcement" role="status" aria-atomic="true">
      {{ announcement }}
    </p>
    <UiButton
      id="product-add-choice"
      variant="secondary"
      :disabled="disabled"
      @activate="add"
      >Добавить опцию</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiCheckbox from "../../shared/ui/UiCheckbox/UiCheckbox.vue";
import { validChoiceOrders } from "../../entities/catalog/product.mapper";
import type {
  ProductChoicesProps,
  ProductChoicesEmits,
} from "./ProductChoices.types";

const props = defineProps<ProductChoicesProps>();
const emit = defineEmits<ProductChoicesEmits>();
const movable = computed(() => validChoiceOrders(props.choices));
const announcement = ref("");

async function add() {
  emit("add");
  await nextTick();
  const choice = props.choices.at(-1);

  if (choice !== undefined)
    document.getElementById(`choice-${choice.key}-portionLabel`)?.focus();
}

async function remove(key: number) {
  const index = props.choices.findIndex((choice) => choice.key === key);

  emit("remove", key);
  await nextTick();
  const next = props.choices[index] ?? props.choices[index - 1];

  (next === undefined
    ? document.getElementById("product-add-choice")
    : document.getElementById(`choice-${next.key}-portionLabel`)
  )?.focus();
}

async function move(key: number, direction: -1 | 1) {
  emit("move", key, direction);
  await nextTick();
  const index = props.choices.findIndex((choice) => choice.key === key);
  const choice = props.choices[index];

  if (choice === undefined) return;

  announcement.value = `${choice.portionLabel}: позиция ${index + 1} из ${props.choices.length}`;
  const button = document.getElementById(
    `choice-${direction === -1 ? "up" : "down"}-${key}`,
  );

  (button?.matches(":disabled")
    ? document.getElementById(`choice-${key}-row`)
    : button
  )?.focus();
}
</script>

<style scoped>
.product-choices {
  display: grid;
  justify-items: stretch;
  gap: var(--space-xl);
  min-inline-size: 0;
}
.product-choices__row {
  display: grid;
  gap: var(--space-lg);
  min-inline-size: 0;
  padding: var(--space-lg);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--field-radius);
  overflow-wrap: anywhere;
}
.product-choices__row legend {
  padding-inline: var(--space-sm);
  font-weight: var(--weight-label);
}
.product-choices__error {
  color: var(--color-danger);
  font-size: var(--font-data);
}
</style>
