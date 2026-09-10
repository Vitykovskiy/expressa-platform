<template>
  <ui-btn
    type="button"
    class="product-card"
    :class="{ 'product-card--unavailable': !props.product.isAvailable }"
    stacked
    variant="text"
    :disabled="!props.product.isAvailable"
    :aria-describedby="unavailabilityStatusId"
    @click="emit('select', props.product.id)"
  >
    <span class="product-card__info">
      <span class="product-card__name">{{ props.product.name }}</span>
      <span v-if="description" class="product-card__description">
        {{ description }}
      </span>
      <span
        v-if="!props.product.isAvailable"
        :id="unavailabilityStatusId"
        class="product-card__availability"
        role="status"
        >{{ PRODUCT_CARD_UNAVAILABLE_STATUS }}</span
      >
    </span>
    <span class="product-card__prices">
      <template v-if="props.product.type === 'DRINK'">
        <span
          v-for="variant in props.product.variants"
          :key="variant.id"
          class="product-card__price"
          :class="{ 'product-card__price--unavailable': !variant.isAvailable }"
          >{{ variant.size }} · {{ formatRubles(variant.price) }}</span
        >
      </template>
      <span v-else class="product-card__price">
        {{ formatRubles(props.product.price) }}
      </span>
    </span>
    <span
      v-if="!props.product.isAvailable"
      class="product-card__unavailable-veil"
      aria-hidden="true"
    />
  </ui-btn>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import { formatRubles } from "@/entities/customer/model/money";
import { PRODUCT_CARD_UNAVAILABLE_STATUS } from "./ProductCard.constants";
import type { ProductCardEmits, ProductCardProps } from "./ProductCard.types";
const props = defineProps<ProductCardProps>();
const emit = defineEmits<ProductCardEmits>();
const description = computed(() => props.product.description.trim());
const unavailabilityStatusId = computed(() =>
  props.product.isAvailable
    ? undefined
    : `product-card-${props.product.id}-availability`,
);
</script>
<style scoped lang="scss">
.product-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 44px;
  padding: var(--customer-space-10) var(--customer-space-11);
  color: var(--customer-text-on-surface);
  text-align: left;
  background: var(--customer-surface);
  border: 0;
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card-raised);
  overflow: hidden;
  position: relative;
}
.product-card:disabled {
  --customer-state-disabled-opacity: 1;
  box-shadow: none;
}
.product-card__name,
.product-card__description {
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
  line-height: var(--customer-line-height-compact);
}
.product-card__description {
  color: var(--customer-color-text-muted-on-surface);
  margin-bottom: var(--customer-space-7);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
  line-height: 1.5;
}
.product-card__prices {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--customer-space-4);
  justify-content: flex-start;
  width: 100%;
  margin-top: auto;
}
.product-card__availability {
  display: block;
  position: relative;
  z-index: 2;
  color: var(--customer-danger);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
  line-height: 1.5;
}
.product-card__unavailable-veil {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: color-mix(in srgb, var(--customer-surface) 45%, transparent);
  pointer-events: none;
}
.product-card__price {
  padding: var(--customer-space-3) var(--customer-space-7);
  color: var(--customer-background);
  background: var(--customer-color-info-surface);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  line-height: 1.5;
}
.product-card__price--unavailable {
  opacity: 0.45;
}
</style>
