<template>
  <section class="product-detail" aria-labelledby="product-detail-title">
    <header class="product-detail__header">
      <p class="product-detail__eyebrow">
        {{ category.name }}
      </p>
      <h1 id="product-detail-title" class="product-detail__title">
        {{ product.name }}
      </h1>
      <p class="product-detail__total" aria-live="polite">
        {{ formatMinorAmount(totalMinor) }}
      </p>
    </header>

    <div class="product-detail__content">
      <p class="product-detail__description">
        {{ product.description }}
      </p>

      <fieldset v-if="product.type === 'DRINK'" class="product-detail__options">
        <legend class="product-detail__options-title">Размер</legend>
        <div class="product-detail__choices">
          <ui-btn
            v-for="variant in product.variants"
            :key="variant.id"
            type="button"
            :class="{
              'product-detail__choice--selected':
                configuration.selectedVariantId === variant.id,
            }"
            class="product-detail__choice product-detail__choice--size"
            :aria-pressed="configuration.selectedVariantId === variant.id"
            :disabled="!variant.isAvailable"
            @click="selectVariant(variant.id)"
          >
            {{ variant.size }} · {{ formatMinorAmount(variant.priceMinor) }}
          </ui-btn>
        </div>
      </fieldset>

      <fieldset
        v-for="group in product.modifierGroups"
        :key="group.id"
        class="product-detail__options"
      >
        <legend class="product-detail__options-title">{{ group.name }}</legend>
        <div class="product-detail__choices">
          <ui-btn
            v-for="option in group.options"
            :key="option.id"
            type="button"
            :class="{
              'product-detail__choice--selected': isOptionSelected(
                group.id,
                option.id,
              ),
            }"
            class="product-detail__choice product-detail__choice--addon"
            :aria-pressed="isOptionSelected(group.id, option.id)"
            :disabled="
              isOptionDisabled(group.id, option.id, option.isAvailable)
            "
            @click="toggleOption(group.id, option.id)"
          >
            {{ option.name }} · {{ formatMinorAmount(option.priceDeltaMinor) }}
          </ui-btn>
        </div>
      </fieldset>
    </div>

    <footer class="product-detail__footer">
      <div class="product-detail__quantity" aria-label="Количество">
        <ui-icon-btn
          type="button"
          aria-label="Уменьшить количество"
          :disabled="configuration.quantity === 1"
          @click="setQuantity(configuration.quantity - 1)"
        >
          <Minus :size="16" :stroke-width="3" aria-hidden="true" />
        </ui-icon-btn>
        <output aria-live="polite">{{ configuration.quantity }}</output>
        <ui-icon-btn
          type="button"
          aria-label="Увеличить количество"
          @click="setQuantity(configuration.quantity + 1)"
        >
          <Plus :size="16" :stroke-width="3" aria-hidden="true" />
        </ui-icon-btn>
      </div>
      <ui-btn
        type="button"
        class="product-detail__submit"
        :disabled="!isValid"
        @click="submit"
      >
        <ShoppingCart :size="17" :stroke-width="2.5" aria-hidden="true" />
        <span class="product-detail__submit-label">
          {{ actionLabel }} · {{ formatMinorAmount(totalMinor) }}
        </span>
      </ui-btn>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Minus, Plus, ShoppingCart } from "lucide-vue-next";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import { formatMinorAmount } from "@/entities/customer/model/money";
import {
  createProductConfiguration,
  getProductConfigurationTotals,
  isProductConfigurationValid,
  selectProductConfigurationVariant,
  setProductConfigurationQuantity,
  toCartItemDraft,
  toggleProductConfigurationOption,
} from "./product-configuration";
import type {
  ProductDetailScreenEmits,
  ProductDetailScreenProps,
} from "./ProductDetailScreen.types";

const props = defineProps<ProductDetailScreenProps>();

const emit = defineEmits<ProductDetailScreenEmits>();

const configuration = ref(createInitialConfiguration());
const totals = computed(() =>
  getProductConfigurationTotals(configuration.value),
);
const totalMinor = computed(() => totals.value?.lineTotalMinor ?? 0);
const isValid = computed(() =>
  isProductConfigurationValid(configuration.value),
);
const actionLabel = computed(() => (props.cartItem ? "Изменить" : "Добавить"));

watch(
  () => props.product,
  (product) => {
    configuration.value = createInitialConfiguration(product);
  },
);

function selectVariant(variantId: string): void {
  configuration.value = selectProductConfigurationVariant(
    configuration.value,
    variantId,
  );
}
function setQuantity(quantity: number): void {
  configuration.value = setProductConfigurationQuantity(
    configuration.value,
    quantity,
  );
}
function toggleOption(groupId: string, optionId: string): void {
  configuration.value = toggleProductConfigurationOption(
    configuration.value,
    groupId,
    optionId,
  );
}
function isOptionSelected(groupId: string, optionId: string): boolean {
  return (
    configuration.value.selectedModifierGroups
      .find((group) => group.groupId === groupId)
      ?.optionIds.includes(optionId) ?? false
  );
}
function isOptionDisabled(
  groupId: string,
  optionId: string,
  isAvailable: boolean,
): boolean {
  if (!isAvailable) return true;
  const group = configuration.value.product.modifierGroups.find(
    (candidate) => candidate.id === groupId,
  );
  const selected =
    configuration.value.selectedModifierGroups.find(
      (candidate) => candidate.groupId === groupId,
    )?.optionIds ?? [];
  if (group === undefined) return true;
  return (
    !selected.includes(optionId) &&
    group.selectionType === "multiple" &&
    selected.length >= group.maxSelect
  );
}

function submit(): void {
  const item = toCartItemDraft(configuration.value);
  if (item !== null) emit("submit", item, props.cartItem?.id);
}
function createInitialConfiguration(product = props.product) {
  const initial = createProductConfiguration(product);
  const cartItem = props.cartItem;
  if (!cartItem || cartItem.productId !== product.id) return initial;
  return {
    ...initial,
    quantity: cartItem.quantity,
    selectedVariantId:
      cartItem.type === "DRINK" ? cartItem.selectedVariant.id : null,
    selectedModifierGroups: initial.selectedModifierGroups.map((group) => ({
      ...group,
      optionIds: cartItem.selectedModifierOptions
        .filter((option) => option.groupId === group.groupId)
        .map((option) => option.id),
    })),
  };
}
</script>

<style scoped lang="scss">
.product-detail {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  color: var(--customer-text);
}
.product-detail__header {
  padding: var(--customer-space-15) var(--customer-space-11)
    var(--customer-space-13);
  margin: var(--customer-space-7) var(--customer-space-9) 0;
  background: var(--customer-color-surface-subtle);
  border-radius: var(--customer-radius-xl);
}
.product-detail__eyebrow,
.product-detail__options-title {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}
.product-detail__eyebrow {
  margin: 0 0 var(--customer-space-5);
}
.product-detail__title {
  margin: 0 0 var(--customer-space-7);
  color: var(--customer-text);
  font-size: var(--customer-font-size-state);
  font-weight: var(--customer-font-weight-black);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-tight);
}
.product-detail__total {
  margin: 0;
  font-size: var(--customer-font-size-6xl);
  font-weight: var(--customer-font-weight-black);
}
.product-detail__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--customer-space-11);
  padding: var(--customer-space-13) var(--customer-space-9);
}
.product-detail__description {
  margin: 0;
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-body);
  font-weight: var(--customer-font-weight-semibold);
  line-height: var(--customer-line-height-relaxed);
}
.product-detail__options {
  margin: 0;
  padding: 0;
  border: 0;
}
.product-detail__options-title {
  padding: 0 0 var(--customer-space-6);
}
.product-detail__choices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--customer-space-5);
}
.product-detail__choice {
  padding: var(--customer-space-6) var(--customer-space-9);
  color: var(--customer-text);
  background: var(--customer-color-surface-subtle);
  border: 0;
  border-radius: var(--customer-radius-md);
  font: inherit;
  font-size: var(--customer-font-size-body);
  font-weight: var(--customer-font-weight-extrabold);
  cursor: pointer;
  transition: var(--customer-transition-transform);
}
.product-detail__choice--size {
  min-width: var(--customer-size-control-xl);
  padding: var(--customer-space-8) var(--customer-space-9);
}
.product-detail__choice--addon {
  padding: var(--customer-space-5) var(--customer-space-8);
}
.product-detail__choice:active {
  transform: var(--customer-transform-press);
}
.product-detail__choice:focus-visible,
.product-detail__quantity .ui-icon-btn:focus-visible,
.product-detail__submit:focus-visible {
  outline: 2px solid var(--customer-color-focus);
  outline-offset: 2px;
}
.product-detail__choice--selected {
  color: var(--customer-background);
  background: var(--customer-surface);
}
.product-detail__footer {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: var(--customer-space-7);
  padding: var(--customer-space-9);
  background: var(--customer-background);
  border-top: 1px solid var(--customer-border);
}
.product-detail__quantity {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--customer-space-2);
  overflow: hidden;
  padding: var(--customer-space-2);
  background: var(--customer-color-surface-subtle);
  border-radius: var(--customer-radius);
}
.product-detail__quantity .ui-icon-btn,
.product-detail__quantity output {
  display: grid;
  width: var(--customer-size-control-md);
  min-width: var(--customer-size-control-md);
  height: var(--customer-size-control-md);
  place-items: center;
  color: var(--customer-text);
  background: transparent;
  border: 0;
  font: inherit;
  font-size: var(--customer-font-size-xl);
  font-weight: var(--customer-font-weight-black);
}
.product-detail__quantity .ui-icon-btn {
  min-height: var(--customer-size-control-md);
  border-radius: var(--customer-radius-round);
  cursor: pointer;
}
.product-detail__quantity output {
  width: var(--customer-size-control-sm);
  min-width: var(--customer-size-control-sm);
}
.product-detail__submit {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: var(--customer-space-4);
  min-height: var(--customer-size-control-xl);
  padding: var(--customer-space-5) var(--customer-space-9);
  color: var(--customer-text);
  background: var(--customer-primary);
  border: 0;
  border-radius: var(--customer-radius);
  font: inherit;
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
  cursor: pointer;
}
@media (min-width: 1024px) {
  .product-detail__header,
  .product-detail__content {
    padding-right: 0;
    padding-left: 0;
  }
  .product-detail__header {
    margin-right: 0;
    margin-left: 0;
  }
  .product-detail__footer {
    margin: 0 0 var(--customer-space-9);
    padding: var(--customer-space-9) 0;
  }
}
</style>
