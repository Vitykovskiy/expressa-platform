<template>
  <ui-btn
    type="button"
    class="product-card"
    stacked
    variant="text"
    :disabled="!props.product.isAvailable"
    @click="emit('select', props.product.id)"
    ><span class="product-card__info"
      ><span class="product-card__name">{{ props.product.name }}</span
      ><span class="product-card__type">{{ productKind }}</span></span
    ><span class="product-card__prices"
      ><template v-if="props.product.type === 'DRINK'"
        ><span
          v-for="variant in props.product.variants"
          :key="variant.id"
          class="product-card__price"
          :class="{ 'product-card__price--unavailable': !variant.isAvailable }"
          >{{ variant.size }} ·
          {{ formatMinorAmount(variant.priceMinor) }}</span
        ></template
      ><span v-else class="product-card__price">{{
        formatMinorAmount(props.product.priceMinor)
      }}</span></span
    ></ui-btn
  >
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import { formatMinorAmount } from "../../shared/model/money";
import type { ProductCardEmits, ProductCardProps } from "./ProductCard.types";
const props = defineProps<ProductCardProps>();
const emit = defineEmits<ProductCardEmits>();
const productKind = computed(() =>
  props.product.type === "DRINK" ? "Напиток" : "Еда и другое",
);
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
.product-card__info {
  display: grid;
  gap: var(--customer-space-2);
  min-width: 0;
}
.product-card__name {
  font-size: var(--customer-font-size-xl);
  font-weight: var(--customer-font-weight-extrabold);
}
.product-card__type {
  color: var(--customer-color-text-muted-on-surface);
}
.product-card__prices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--customer-space-4);
  justify-content: flex-start;
  width: 100%;
}
.product-card__price {
  padding: var(--customer-space-3) var(--customer-space-7);
  color: var(--customer-background);
  background: var(--customer-color-info-surface);
  border-radius: var(--customer-radius-pill);
}
.product-card__price--unavailable {
  opacity: 0.45;
}
.product-card :deep(.v-btn__content) {
  display: grid;
  justify-content: start;
  row-gap: var(--customer-space-7);
  width: 100%;
  min-width: 0;
  text-align: left;
  white-space: normal;
}
</style>
