<template>
  <section class="product-configurator">
    <h2 class="product-configurator-title">{{ name }}</h2>
    <div
      v-if="sizes.length"
      class="product-configurator-sizes"
      role="radiogroup"
      aria-label="Размер"
    >
      <button
        v-for="size in sizes"
        :key="size.id"
        class="product-configurator-size"
        :class="{
          'product-configurator-size--selected': size.id === selectedSize,
        }"
        :aria-checked="size.id === selectedSize"
        role="radio"
        type="button"
        @click="selectedSize = size.id"
      >
        {{ size.label }} · {{ size.price }} ₽
      </button>
    </div>
    <ModifierGroup
      v-if="modifiers.length"
      v-model="selectedModifiers"
      title="Добавки"
      :options="modifiers"
      :min="minModifiers"
      :max="maxModifiers"
    />
    <div class="product-configurator-footer">
      <QuantityStepper v-model="quantity" :max="maxQuantity" />
      <PriceLabel :amount="amount * quantity" />
      <UiButton
        class="product-configurator-add"
        :disabled="!isValid"
        @click="add"
      >
        В корзину
      </UiButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import QuantityStepper from "../../../shared/ui/QuantityStepper.vue";
import UiButton from "../../../shared/ui/UiButton.vue";
import ModifierGroup from "./ModifierGroup.vue";
import PriceLabel from "./PriceLabel.vue";

interface SizeOption {
  id: string;
  label: string;
  price: number;
}

interface ModifierOption {
  id: string;
  label: string;
  price?: number;
  default?: boolean;
}

const props = withDefaults(
  defineProps<{
    name: string;
    basePrice: number;
    sizes?: readonly SizeOption[];
    modifiers?: readonly ModifierOption[];
    minModifiers?: number;
    maxModifiers?: number;
    maxQuantity?: number;
  }>(),
  {
    sizes: () => [],
    modifiers: () => [],
    minModifiers: 0,
    maxModifiers: 20,
    maxQuantity: 20,
  },
);
const emit = defineEmits<{
  add: [quantity: number, sizeId: string | undefined, modifierIds: string[]];
}>();

const initialSize =
  props.sizes.find((size) => size.label === "M") ?? props.sizes[0];
const selectedSize = shallowRef<string | undefined>(initialSize?.id);
const selectedModifiers = shallowRef(
  props.modifiers.filter((option) => option.default).map((option) => option.id),
);
const quantity = shallowRef(1);
const amount = computed(() => {
  const size = props.sizes.find((item) => item.id === selectedSize.value);
  const modifiersPrice = props.modifiers
    .filter((item) => selectedModifiers.value.includes(item.id))
    .reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (size?.price ?? props.basePrice) + modifiersPrice;
});
const isValid = computed(
  () =>
    selectedModifiers.value.length >= props.minModifiers &&
    selectedModifiers.value.length <= props.maxModifiers,
);

function add(): void {
  if (!isValid.value) return;
  emit("add", quantity.value, selectedSize.value, selectedModifiers.value);
}
</script>

<style scoped>
.product-configurator {
  display: grid;
  gap: var(--fo-space-3);
  padding: var(--fo-space-3);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  background: var(--fo-surface);
  font: 400 1rem/1.2 var(--fo-font);
}

.product-configurator-title {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 1.125rem;
}

.product-configurator-sizes,
.product-configurator-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fo-space-2);
}

.product-configurator-size {
  min-height: 2.75rem;
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-text);
  background: var(--fo-surface);
  font: 600 0.875rem/1.2 var(--fo-font);
  cursor: pointer;
}

.product-configurator-size--selected {
  border-color: var(--fo-brand);
  color: var(--fo-surface);
  background: var(--fo-brand);
}

.product-configurator-add {
  margin-left: auto;
}

@media (prefers-reduced-motion: reduce) {
  .product-configurator-size {
    transition: none;
  }
}
</style>
