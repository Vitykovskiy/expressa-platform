<template>
  <main class="page">
    <AppHeader
      title="Настройка товара"
      :cart-count="cartCount"
      @cart="emit('cart')"
    />
    <section class="product-sheet-content">
      <ProductConfigurator v-bind="product" @add="add" />
    </section>
    <Snackbar
      :open="added"
      message="Товар добавлен в корзину"
      @close="added = false"
    />
  </main>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";

import Snackbar from "../domain-ui/Feedback/Snackbar.vue";
import ProductConfigurator from "../domain-ui/Menu/ProductConfigurator.vue";
import AppHeader from "../domain-ui/Navigation/AppHeader.vue";

export interface Product {
  name: string;
  basePrice: number;
  sizes?: readonly { id: string; label: string; price: number }[];
  modifiers?: readonly {
    id: string;
    label: string;
    price?: number;
    default?: boolean;
  }[];
  minModifiers?: number;
  maxModifiers?: number;
  maxQuantity?: number;
}
defineProps<{ product: Product; cartCount?: number }>();
const emit = defineEmits<{
  add: [quantity: number, sizeId: string | undefined, modifierIds: string[]];
  cart: [];
}>();
const added = shallowRef(false);
function add(
  quantity: number,
  sizeId: string | undefined,
  modifierIds: string[],
): void {
  added.value = true;
  emit("add", quantity, sizeId, modifierIds);
}
</script>

<style scoped>
.page {
  display: grid;
  min-height: 100%;
  gap: var(--fo-space-3);
  background: var(--fo-surface-muted);
  color: var(--fo-text);
}
.product-sheet-content {
  margin: 0 var(--fo-space-3);
}
</style>
