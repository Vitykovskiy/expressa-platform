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
      v-if="category.products.length"
      class="menu-group__grid"
      :aria-label="`Товары категории ${category.name}`"
    >
      <li v-for="product in category.products" :key="product.id">
        <product-card :product="product" @select="selectProduct" />
      </li>
    </ul>
    <div v-else class="menu-group__empty" role="status">
      <p class="menu-group__empty-title">В этой категории пока нет товаров</p>
      <p class="menu-group__empty-description">
        Выберите другую категорию в меню.
      </p>
      <ui-btn
        type="button"
        class="menu-group__empty-action"
        @click="returnToMenu"
      >
        К категориям
      </ui-btn>
    </div>
  </section>
  <section v-else class="menu-group menu-group--missing" aria-live="polite">
    <p>Категория не найдена</p>
  </section>
</template>

<script setup lang="ts">
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
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

function returnToMenu(): void {
  emit("returnToMenu");
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
  grid-template-columns: minmax(0, 1fr);
  gap: var(--customer-space-7);
  width: 100%;
  margin: 0;
  padding: var(--customer-space-9);
  list-style: none;
}
.menu-group__grid > li {
  min-width: 0;
}
.menu-group__empty {
  display: grid;
  gap: var(--customer-space-5);
  justify-items: start;
  padding: var(--customer-space-12) var(--customer-space-9);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card-raised);
}
.menu-group__empty-title,
.menu-group__empty-description {
  margin: 0;
}
.menu-group__empty-title {
  font-size: var(--customer-font-size-xl);
  font-weight: var(--customer-font-weight-extrabold);
  line-height: var(--customer-line-height-compact);
}
.menu-group__empty-description {
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-base);
  line-height: var(--customer-line-height-normal);
}
.menu-group__empty-action {
  margin-top: var(--customer-space-3);
}
.menu-group--missing {
  align-items: center;
  justify-content: center;
  padding-top: var(--customer-space-16);
  padding-bottom: var(--customer-space-16);
  color: var(--customer-color-text-muted-on-brand);
}
@media (min-width: 768px) {
  .menu-group__empty {
    width: calc(100% - var(--customer-space-16) * 2);
    max-width: var(--customer-size-content-detail);
    margin-right: auto;
    margin-left: auto;
  }
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
