<template>
  <article class="product-card" :class="cardClass">
    <div class="product-card-image" aria-hidden="true">
      {{ imageLabel ?? "☕" }}
    </div>
    <div class="product-card-content">
      <h3 class="product-card-title">{{ name }}</h3>
      <p v-if="description" class="product-card-description">
        {{ description }}
      </p>
      <AvailabilityState :available="isSelectable" />
      <PriceLabel
        v-if="price !== undefined && hasValidPrice"
        :amount="price"
        :prefix="pricePrefix"
      />
      <UiButton :disabled="!isSelectable" @click="emit('select')">
        {{ actionLabel }}
      </UiButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";

import UiButton from "../../../shared/ui/UiButton.vue";
import AvailabilityState from "./AvailabilityState.vue";
import PriceLabel from "./PriceLabel.vue";

defineOptions({ name: "FoProductCard" });

const props = defineProps<{
  name: string;
  description?: string;
  kind: "DRINK" | "OTHER";
  price?: number;
  available: boolean;
  imageLabel?: string;
}>();
const emit = defineEmits<{ select: [] }>();

const hasValidPrice = computed(
  () =>
    props.price !== undefined &&
    Number.isFinite(props.price) &&
    props.price >= 0,
);
const isSelectable = computed(() => props.available && hasValidPrice.value);
const pricePrefix = computed(() => (props.kind === "DRINK" ? "от" : undefined));
const actionLabel = computed(() =>
  isSelectable.value ? "Выбрать" : "Недоступно",
);
const cardClass = computed(() => ({
  "product-card--unavailable": !isSelectable.value,
}));
</script>

<style scoped>
.product-card {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: var(--fo-space-3);
  padding: var(--fo-space-3);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  background: var(--fo-surface);
  font: 400 1rem/1.2 var(--fo-font);
}

.product-card-image {
  display: grid;
  min-height: 5rem;
  place-items: center;
  border-radius: var(--fo-radius-sm);
  background: var(--fo-surface-muted);
  font-size: 2.5rem;
}

.product-card-content {
  display: grid;
  min-width: 0;
  gap: var(--fo-space-2);
}

.product-card-title,
.product-card-description {
  margin: 0;
  overflow-wrap: anywhere;
}

.product-card-title {
  font-size: 1rem;
}

.product-card-description {
  color: var(--fo-muted);
  font-size: 0.875rem;
  line-height: 1.35;
}

.product-card--unavailable {
  opacity: 0.8;
}

@media (max-width: 30rem) {
  .product-card {
    grid-template-columns: 1fr;
  }

  .product-card-image {
    min-height: 3.5rem;
  }
}
</style>
