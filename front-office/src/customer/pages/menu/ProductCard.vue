<template>
  <ui-btn
    type="button"
    class="product-card"
    stacked
    variant="text"
    @click="emit('select', props.product.id)"
    ><span class="product-card__name">{{ props.product.name }}</span
    ><span class="product-card__type">{{ props.typeLabel }}</span
    ><span class="product-card__prices"
      ><template v-if="props.product.sizes?.length"
        ><span
          v-for="size in props.product.sizes"
          :key="size.sizeCode"
          class="product-card__price"
          >{{ size.sizeCode }} - {{ size.price }}
          {{ PRODUCT_CARD_PRICE_SUFFIX }}</span
        ></template
      ><span
        v-else-if="props.product.sizes === undefined"
        class="product-card__price"
        >{{ props.product.basePrice }} {{ PRODUCT_CARD_PRICE_SUFFIX }}</span
      ></span
    ></ui-btn
  >
</template>

<script setup lang="ts">
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import { PRODUCT_CARD_PRICE_SUFFIX } from "./ProductCard.constants";
import type { ProductCardEmits, ProductCardProps } from "./ProductCard.types";
const props = defineProps<ProductCardProps>();
const emit = defineEmits<ProductCardEmits>();
</script>
<style scoped lang="scss">
.product-card {
  display: block;
  width: 100%;
  height: auto;
  min-height: 44px;
  padding: var(--customer-space-10) var(--customer-space-11);
  color: var(--customer-text-on-surface);
  text-align: left;
  background: var(--customer-surface);
  border: 0;
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card-raised);
}
.product-card__name,
.product-card__type {
  display: block;
}
.product-card__name {
  margin-bottom: var(--customer-space-2);
  font-size: var(--customer-font-size-xl);
  font-weight: var(--customer-font-weight-extrabold);
}
.product-card__type {
  margin-bottom: var(--customer-space-7);
  color: var(--customer-color-text-muted-on-surface);
}
.product-card__prices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--customer-space-4);
}
.product-card__price {
  padding: var(--customer-space-3) var(--customer-space-7);
  color: var(--customer-background);
  background: var(--customer-color-info-surface);
  border-radius: var(--customer-radius-pill);
}
</style>
