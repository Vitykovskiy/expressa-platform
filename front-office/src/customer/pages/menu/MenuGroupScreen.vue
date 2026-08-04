<template>
  <section
    v-if="category"
    class="menu-group"
    :aria-labelledby="`menu-group-${category.id}`"
  >
    <header class="menu-group__header">
      <p class="menu-group__eyebrow">{{ category.products.length }} позиций</p>
      <h1 :id="`menu-group-${category.id}`" class="menu-group__title">
        {{ category.name }}
      </h1>
    </header>

    <ul
      class="menu-group__grid"
      :aria-label="`Товары категории ${category.name}`"
    >
      <li v-for="product in category.products" :key="product.id">
        <product-card :product="product" @select="selectProduct" />
      </li>
    </ul>
  </section>
  <section v-else class="menu-group menu-group--missing" aria-live="polite">
    <p>Категория не найдена</p>
  </section>
</template>

<script setup lang="ts">
import ProductCard from "./ProductCard.vue";
import type {
  MenuGroupScreenEmits,
  MenuGroupScreenProps,
} from "./MenuGroupScreen.types";

defineProps<MenuGroupScreenProps>();

const emit = defineEmits<MenuGroupScreenEmits>();

function selectProduct(productId: string): void {
  emit("selectProduct", productId);
}
</script>

<style scoped lang="scss">
.menu-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding-bottom: var(--customer-space-17);
  color: var(--customer-text);
}
.menu-group__header {
  padding: var(--customer-space-11) var(--customer-space-9)
    var(--customer-space-15);
}
.menu-group__eyebrow {
  margin: 0 0 var(--customer-space-4);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}
.menu-group__title {
  margin: 0;
  color: var(--customer-text);
  font-size: var(--customer-font-size-display);
  font-weight: var(--customer-font-weight-black);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-tight);
  overflow-wrap: anywhere;
}
.menu-group__grid {
  display: grid;
  gap: var(--customer-space-7);
  margin: 0;
  padding: var(--customer-space-9);
  list-style: none;
}
.menu-group--missing {
  align-items: center;
  justify-content: center;
  padding-top: var(--customer-space-16);
  padding-bottom: var(--customer-space-16);
  color: var(--customer-color-text-muted-on-brand);
}
@media (min-width: 1024px) {
  .menu-group {
    padding-bottom: var(--customer-space-17);
  }
  .menu-group__header {
    padding-right: var(--customer-space-16);
    padding-left: var(--customer-space-16);
  }
  .menu-group__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-right: var(--customer-space-16);
    padding-left: var(--customer-space-16);
  }
}
@media (min-width: 1280px) {
  .menu-group__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
