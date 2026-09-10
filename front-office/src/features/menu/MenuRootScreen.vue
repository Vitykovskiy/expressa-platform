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
        <ui-btn
          type="button"
          class="menu-root__category-card"
          :aria-label="`Открыть категорию ${category.name}`"
          @click="selectCategory(category.id)"
        >
          <span class="menu-root__category-info">
            <span class="menu-root__category-name">{{ category.name }}</span>
            <span class="menu-root__category-count">{{
              categoryCount(category.products.length)
            }}</span>
          </span>
          <span class="menu-root__category-arrow" aria-hidden="true">
            <ArrowRight />
          </span>
        </ui-btn>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import type {
  MenuRootScreenEmits,
  MenuRootScreenProps,
} from "./MenuRootScreen.types";

defineProps<MenuRootScreenProps>();

const emit = defineEmits<MenuRootScreenEmits>();

function selectCategory(categoryId: string): void {
  emit("selectCategory", categoryId);
}

function categoryCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  const noun =
    lastTwo >= 11 && lastTwo <= 14
      ? "позиций"
      : last === 1
        ? "позиция"
        : last >= 2 && last <= 4
          ? "позиции"
          : "позиций";
  return `${count} ${noun}`;
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--customer-space-8);
  width: 100%;
  margin: 0;
  padding: 0 var(--customer-space-9) var(--customer-space-9);
  list-style: none;
}
.menu-root__categories > li {
  min-width: 0;
}
.menu-root__category-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--customer-size-control-xl);
  padding: var(--customer-space-8) var(--customer-space-11);
  color: var(--customer-text-on-surface);
  text-align: left;
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card-raised);
}
.menu-root__category-info {
  display: grid;
  gap: var(--customer-space-3);
  min-width: 0;
}
.menu-root__category-name {
  font-size: var(--customer-font-size-2xl);
  font-weight: var(--customer-font-weight-black);
  line-height: var(--customer-line-height-compact);
  overflow-wrap: anywhere;
}
.menu-root__category-count {
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}
.menu-root__category-arrow {
  display: grid;
  flex: 0 0 auto;
  width: var(--customer-size-control-md);
  height: var(--customer-size-control-md);
  place-items: center;
  color: var(--customer-background);
  background: var(--customer-color-info-surface);
  border-radius: var(--customer-radius-round);
}
.menu-root__category-arrow :deep(svg) {
  width: var(--customer-font-size-lg);
  height: var(--customer-font-size-lg);
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
