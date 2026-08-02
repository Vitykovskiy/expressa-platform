<template>
  <section class="page">
    <h1>Меню</h1>
    <Skeleton v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="emit('retry')" />
    <EmptyState
      v-else-if="categories.length === 0 && products.length === 0"
      title="Меню пусто"
      message="Создайте первую категорию или товар."
    />
    <template v-else>
      <section>
        <h2>Категории</h2>
        <CategoryListItem
          v-for="category in categories"
          :key="category.id"
          :category="category"
          @open="emit('open-category', $event)"
        />
      </section>
      <section>
        <h2>Товары</h2>
        <ProductListItem
          v-for="product in products"
          :key="product.id"
          :product="product"
          @open="emit('open-product', $event)"
        />
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import EmptyState from "../domain-ui/Feedback/EmptyState.vue";
import ErrorState from "../domain-ui/Feedback/ErrorState.vue";
import Skeleton from "../domain-ui/Feedback/Skeleton.vue";
import CategoryListItem, {
  type Category,
} from "../domain-ui/Menu/CategoryListItem.vue";
import ProductListItem, {
  type Product,
} from "../domain-ui/Menu/ProductListItem.vue";
withDefaults(
  defineProps<{
    categories: Category[];
    products: Product[];
    loading?: boolean;
    error?: string;
  }>(),
  { loading: false, error: "" },
);
const emit = defineEmits<{
  "open-category": [id: string];
  "open-product": [id: string];
  retry: [];
}>();
</script>

<style scoped>
.page,
section {
  display: grid;
  gap: var(--expressa-space-2);
}
.page {
  gap: var(--expressa-space-4);
}
h1,
h2 {
  margin: 0;
}
</style>
