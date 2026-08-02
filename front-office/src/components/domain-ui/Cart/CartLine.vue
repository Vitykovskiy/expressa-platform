<template>
  <article class="line">
    <div class="line-content">
      <h3>{{ name }}</h3>
      <p v-if="details">{{ details }}</p>
      <PriceLabel :amount="price * quantity" />
    </div>
    <QuantityStepper
      :model-value="quantity"
      :max="maxQuantity"
      @update:model-value="updateQuantity"
    />
    <button
      class="remove"
      type="button"
      aria-label="Удалить позицию"
      @click="emit('remove')"
    >
      Удалить
    </button>
  </article>
</template>
<script setup lang="ts">
import QuantityStepper from "../../../shared/ui/QuantityStepper.vue";
import PriceLabel from "../Menu/PriceLabel.vue";
defineOptions({ name: "FoCartLine" });
withDefaults(
  defineProps<{
    name: string;
    details?: string;
    price: number;
    quantity: number;
    maxQuantity?: number;
  }>(),
  { details: undefined, maxQuantity: 20 },
);
const emit = defineEmits<{
  "update:quantity": [quantity: number];
  remove: [];
}>();
function updateQuantity(quantity: number): void {
  emit("update:quantity", quantity);
}
</script>
<style scoped>
.line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--fo-space-2);
  padding: var(--fo-space-3);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  font: 400 1rem/1.3 var(--fo-font);
}
.line-content {
  min-width: 0;
}
.line h3,
.line p {
  margin: 0;
  overflow-wrap: anywhere;
}
.line p {
  margin-top: var(--fo-space-1);
  color: var(--fo-muted);
  font-size: 0.875rem;
}
.remove {
  grid-column: 2;
  min-height: 2.75rem;
  border: 0;
  color: var(--fo-danger);
  background: transparent;
  font: 600 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
</style>
