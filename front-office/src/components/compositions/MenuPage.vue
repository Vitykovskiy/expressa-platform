<template>
  <main class="page">
    <AppHeader :cart-count="cartCount" @cart="emit('cart')" />
    <AvailabilityState :available="orderIntakeOpen" />
    <p v-if="!orderIntakeOpen" class="notice" role="status">
      Приём новых заказов временно выключен.
    </p>
    <template v-if="state === 'loading'"><Skeleton :lines="5" /></template>
    <ErrorState
      v-else-if="state === 'error'"
      description="Не удалось загрузить меню."
      retry-label="Повторить"
      @retry="emit('retry')"
    />
    <EmptyState
      v-else-if="state === 'empty'"
      title="Меню пока пусто"
      description="Загляните позже."
    />
    <template v-else>
      <CategoryNavigation v-model="selectedCategory" :categories="categories" />
      <section class="products" aria-label="Товары меню">
        <ProductCard
          v-for="product in visibleProducts"
          :key="product.id"
          v-bind="product"
          @select="emit('select', product.id)"
        />
      </section>
    </template>
    <BottomActionBar
      :label="`В корзине ${cartCount} поз.`"
      :detail="`${cartTotal.toLocaleString('ru-RU')} ₽`"
      :disabled="cartCount === 0"
      @action="emit('cart')"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import EmptyState from "../domain-ui/Feedback/EmptyState.vue";
import ErrorState from "../domain-ui/Feedback/ErrorState.vue";
import Skeleton from "../domain-ui/Feedback/Skeleton.vue";
import AvailabilityState from "../domain-ui/Menu/AvailabilityState.vue";
import ProductCard from "../domain-ui/Menu/ProductCard.vue";
import AppHeader from "../domain-ui/Navigation/AppHeader.vue";
import BottomActionBar from "../domain-ui/Navigation/BottomActionBar.vue";
import CategoryNavigation from "../domain-ui/Navigation/CategoryNavigation.vue";

export interface Category {
  id: string;
  title: string;
}
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  kind: "DRINK" | "OTHER";
  price?: number;
  available: boolean;
  imageLabel?: string;
}

const props = withDefaults(
  defineProps<{
    state?: "ready" | "loading" | "empty" | "error";
    orderIntakeOpen?: boolean;
    categories: readonly Category[];
    products: readonly Product[];
    cartCount?: number;
    cartTotal?: number;
  }>(),
  { state: "ready", orderIntakeOpen: true, cartCount: 0, cartTotal: 0 },
);
const emit = defineEmits<{ cart: []; retry: []; select: [id: string] }>();
const selectedCategory = shallowRef(props.categories[0]?.id ?? "");
const visibleProducts = computed(() =>
  props.products.filter(
    (product) => product.categoryId === selectedCategory.value,
  ),
);
</script>

<style scoped>
.page,
.products {
  display: grid;
  gap: var(--fo-space-3);
}
.page {
  min-height: 100%;
  background: var(--fo-surface-muted);
  color: var(--fo-text);
  font: 400 1rem/1.3 var(--fo-font);
}
.products {
  padding: 0 var(--fo-space-3) var(--fo-space-3);
}
.notice {
  margin: 0;
  padding: 0 var(--fo-space-3);
  color: var(--fo-danger);
  font-weight: 700;
}
</style>
