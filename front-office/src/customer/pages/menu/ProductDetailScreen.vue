<template>
  <section class="product-detail" aria-labelledby="product-detail-title">
    <header class="product-detail__header">
      <p class="product-detail__eyebrow">
        {{ category.name }}
      </p>
      <h1 id="product-detail-title" class="product-detail__title">
        {{ product.name }}
      </h1>
      <p class="product-detail__total" aria-live="polite">{{ totalPrice }} ₽</p>
    </header>

    <div class="product-detail__content">
      <p class="product-detail__description">
        {{ product.description }}
      </p>

      <fieldset v-if="product.sizes?.length" class="product-detail__options">
        <legend class="product-detail__options-title">Размер</legend>
        <div class="product-detail__choices">
          <ui-btn
            v-for="size in product.sizes"
            :key="size.sizeCode"
            type="button"
            :class="{
              'product-detail__choice--selected':
                selectedSize === size.sizeCode,
            }"
            class="product-detail__choice"
            :aria-pressed="selectedSize === size.sizeCode"
            @click="selectedSize = size.sizeCode"
          >
            {{ size.sizeCode }} · {{ size.price }} ₽
          </ui-btn>
        </div>
      </fieldset>

      <fieldset v-if="product.addons?.length" class="product-detail__options">
        <legend class="product-detail__options-title">Добавки</legend>
        <div class="product-detail__choices">
          <ui-btn
            v-for="addon in product.addons"
            :key="addon.id"
            type="button"
            :class="{
              'product-detail__choice--selected': selectedAddonIds.includes(
                addon.id,
              ),
            }"
            class="product-detail__choice"
            :aria-pressed="selectedAddonIds.includes(addon.id)"
            @click="toggleAddon(addon.id)"
          >
            {{ addon.name }} · {{ addon.priceRub }} ₽
          </ui-btn>
        </div>
      </fieldset>
    </div>

    <footer class="product-detail__footer">
      <div class="product-detail__quantity" aria-label="Количество">
        <ui-icon-btn
          type="button"
          aria-label="Уменьшить количество"
          @click="decreaseQuantity"
        >
          <Minus :size="16" :stroke-width="3" aria-hidden="true" />
        </ui-icon-btn>
        <output aria-live="polite">{{ quantity }}</output>
        <ui-icon-btn
          type="button"
          aria-label="Увеличить количество"
          @click="quantity += 1"
        >
          <Plus :size="16" :stroke-width="3" aria-hidden="true" />
        </ui-icon-btn>
      </div>
      <ui-btn type="button" class="product-detail__submit" @click="submit">
        <ShoppingCart :size="17" :stroke-width="2.5" aria-hidden="true" />{{
          actionLabel
        }}
        · {{ totalPrice }} ₽
      </ui-btn>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Minus, Plus, ShoppingCart } from "lucide-vue-next";
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import UiIconBtn from "../../shared/ui/icon-btn/UiIconBtn.vue";
import type { Addon } from "../../shared/model/customer.types";
import type {
  ProductDetailScreenEmits,
  ProductDetailScreenProps,
} from "./ProductDetailScreen.types";

const props = defineProps<ProductDetailScreenProps>();

const emit = defineEmits<ProductDetailScreenEmits>();

const selectedSize = ref(
  props.cartItem?.size ?? props.product.sizes?.[0]?.sizeCode,
);
const selectedAddonIds = ref(props.cartItem?.addons.map(({ id }) => id) ?? []);
const quantity = ref(props.cartItem?.quantity ?? 1);

const selectedAddons = computed<Addon[]>(
  () =>
    props.product.addons?.filter(({ id }) =>
      selectedAddonIds.value.includes(id),
    ) ?? [],
);
const basePrice = computed(
  () =>
    props.product.sizes?.find(({ sizeCode }) => sizeCode === selectedSize.value)
      ?.price ?? props.product.basePrice,
);
const totalPrice = computed(
  () =>
    (basePrice.value +
      selectedAddons.value.reduce((sum, addon) => sum + addon.priceRub, 0)) *
    quantity.value,
);
const actionLabel = computed(() => (props.cartItem ? "Изменить" : "Добавить"));

function toggleAddon(addonId: string): void {
  selectedAddonIds.value = selectedAddonIds.value.includes(addonId)
    ? selectedAddonIds.value.filter((id) => id !== addonId)
    : [...selectedAddonIds.value, addonId];
}

function decreaseQuantity(): void {
  quantity.value = Math.max(1, quantity.value - 1);
}

function submit(): void {
  emit(
    "submit",
    {
      productId: props.product.id,
      productName: props.product.name,
      type: props.product.type,
      size: selectedSize.value,
      sizePrice: basePrice.value,
      addons: selectedAddons.value,
      quantity: quantity.value,
      lineTotalRub: totalPrice.value,
    },
    props.cartItem?.id,
  );
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
  margin: var(--customer-space-7) var(--customer-space-9) 0;
  padding: var(--customer-space-15) var(--customer-space-11)
    var(--customer-space-13);
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
  padding: var(--customer-space-11) var(--customer-space-9);
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
  overflow: hidden;
  background: var(--customer-color-surface-subtle);
  border-radius: var(--customer-radius-xs);
}
.product-detail__quantity .ui-icon-btn,
.product-detail__quantity output {
  display: grid;
  min-width: calc(var(--customer-space-12) * 2);
  width: var(--customer-size-control-lg);
  height: var(--customer-size-control-xl);
  place-items: center;
  color: var(--customer-text);
  background: transparent;
  border: 0;
  font: inherit;
  font-size: var(--customer-font-size-xl);
  font-weight: var(--customer-font-weight-black);
}
.product-detail__quantity .ui-icon-btn {
  min-height: calc(var(--customer-space-12) * 2);
  cursor: pointer;
}
.product-detail__quantity output {
  width: var(--customer-space-17);
  border-right: 1px solid var(--customer-border);
  border-left: 1px solid var(--customer-border);
}
.product-detail__submit {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: var(--customer-space-5);
  min-height: var(--customer-size-control-xl);
  padding: var(--customer-space-5) var(--customer-space-9);
  color: var(--customer-text);
  background: var(--customer-primary);
  border: 0;
  border-radius: var(--customer-radius-xs);
  font: inherit;
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
  cursor: pointer;
}
@media (min-width: 1024px) {
  .product-detail__header,
  .product-detail__content {
    margin-right: var(--customer-space-16);
    margin-left: var(--customer-space-16);
  }
  .product-detail__footer {
    margin: 0 var(--customer-space-16) var(--customer-space-9);
    padding: var(--customer-space-9) 0;
  }
}
</style>
