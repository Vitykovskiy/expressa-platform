<template>
  <section class="menu-root" aria-labelledby="menu-root-title">
    <header class="menu-root__header">
      <h1 id="menu-root-title" class="menu-root__title" tabindex="-1">Меню</h1>
    </header>

    <p class="menu-root__feedback" role="status" aria-atomic="true">
      {{ feedback ?? "" }}
    </p>

    <p v-if="categories.length === 0" class="menu-root__empty" role="status">
      В меню пока нет категорий
    </p>

    <ul v-else class="menu-root__categories" aria-label="Категории меню">
      <li v-for="category in categories" :key="category.id">
        <section
          class="menu-root__category"
          :aria-labelledby="`menu-category-${category.id}`"
        >
          <header class="menu-root__category-header">
            <h2
              :id="`menu-category-${category.id}`"
              class="menu-root__category-name"
            >
              {{ category.name }}
            </h2>
            <ui-btn
              type="button"
              class="menu-root__category-action"
              navigation
              navigation-direction="forward"
              :aria-label="`Открыть категорию ${category.name}`"
              @click="selectCategory(category.id)"
            >
              Открыть категорию
              <ArrowRight aria-hidden="true" />
            </ui-btn>
          </header>
          <ul
            v-if="category.products.length"
            class="menu-root__products"
            :aria-label="`Товары категории ${category.name}`"
          >
            <li v-for="product in category.products" :key="product.id">
              <ProductCard
                :product="product"
                @select="selectProduct(category.id, $event)"
              />
            </li>
          </ul>
          <p v-else class="menu-root__category-empty">
            В этой категории пока нет товаров
          </p>
        </section>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import ProductCard from "./ProductCard.vue";
import type {
  MenuRootScreenEmits,
  MenuRootScreenProps,
} from "./MenuRootScreen.types";

defineProps<MenuRootScreenProps>();

const emit = defineEmits<MenuRootScreenEmits>();

function selectCategory(categoryId: string): void {
  emit("selectCategory", categoryId);
}

function selectProduct(categoryId: string, productId: string): void {
  emit("selectProduct", categoryId, productId);
}
</script>

<style scoped lang="scss">
.menu-root {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding-bottom: var(--customer-space-17);
  color: var(--customer-text);
}
.menu-root__header {
  padding: var(--customer-space-11) var(--customer-space-9);
}
.menu-root__title {
  margin: 0;
  color: var(--customer-text);
  font-size: var(--customer-font-size-page-heading);
  font-weight: var(--customer-font-weight-page-heading);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-page-heading);
}
.menu-root__empty {
  margin: 0;
  padding: var(--customer-space-18) var(--customer-space-9);
  color: var(--customer-text-subtle-on-brand);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-bold);
  text-align: center;
}
.menu-root__feedback {
  min-height: 0;
  margin: 0;
  padding: 0 var(--customer-space-9);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-body);
  font-weight: var(--customer-font-weight-semibold);
  line-height: var(--customer-line-height-body);
}
.menu-root__feedback:not(:empty) {
  padding-bottom: var(--customer-space-7);
}
.menu-root__categories {
  display: grid;
  gap: var(--customer-space-11);
  width: 100%;
  margin: 0;
  padding: 0 var(--customer-space-9) var(--customer-space-9);
  list-style: none;
}
.menu-root__categories > li {
  min-width: 0;
}
.menu-root__category {
  display: grid;
  gap: var(--customer-space-6);
}
.menu-root__category-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: var(--customer-space-7);
}
.menu-root__category-name {
  margin: 0;
  font-size: var(--customer-font-size-2xl);
  font-weight: var(--customer-font-weight-black);
  line-height: var(--customer-line-height-compact);
}
.menu-root__category-action {
  flex: 0 0 auto;
}
.menu-root__products {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--customer-space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}
.menu-root__category-empty {
  margin: 0;
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
}
@media (min-width: 1024px) {
  .menu-root__header,
  .menu-root__categories,
  .menu-root__feedback {
    max-width: none;
    margin: 0;
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
