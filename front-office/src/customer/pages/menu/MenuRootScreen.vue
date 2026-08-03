<template>
  <section class="menu-root" aria-labelledby="menu-root-title">
    <header class="menu-root__header">
      <p class="menu-root__eyebrow">Меню кофейни</p>
      <h1 id="menu-root-title" class="menu-root__title">
        Что будем<br />заказывать?
      </h1>
    </header>

    <p v-if="categories.length === 0" class="menu-root__empty" role="status">
      В меню пока нет категорий
    </p>

    <ul v-else class="menu-root__grid" aria-label="Категории меню">
      <li v-for="category in categories" :key="category.id">
        <ui-btn
          type="button"
          class="menu-root__card"
          variant="text"
          @click="selectCategory(category.id)"
        >
          <span class="menu-root__content">
            <span class="menu-root__name">{{ category.name }}</span>
            <span class="menu-root__count"
              >{{ category.products.length }} позиций</span
            >
          </span>
          <ArrowRight
            class="menu-root__arrow"
            :size="16"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </ui-btn>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import type {
  MenuRootScreenEmits,
  MenuRootScreenProps,
} from "./MenuRootScreen.types";

defineProps<MenuRootScreenProps>();

const emit = defineEmits<MenuRootScreenEmits>();

function selectCategory(categoryId: string): void {
  emit("selectCategory", categoryId);
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
  padding: var(--customer-space-13) var(--customer-space-9)
    var(--customer-space-16);
}
.menu-root__eyebrow {
  margin: 0 0 var(--customer-space-4);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}
.menu-root__title {
  margin: 0;
  color: var(--customer-text);
  font-size: var(--customer-font-size-display);
  font-weight: var(--customer-font-weight-black);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-tight);
}
.menu-root__empty {
  margin: 0;
  padding: var(--customer-space-18) var(--customer-space-9);
  color: var(--customer-text-subtle-on-brand);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-bold);
  text-align: center;
}
.menu-root__grid {
  display: grid;
  gap: var(--customer-space-7);
  margin: 0;
  padding: var(--customer-space-9);
  list-style: none;
}
.menu-root__card {
  display: flex;
  width: 100%;
  height: auto;
  min-height: 44px;
  align-items: center;
  padding: var(--customer-space-10) var(--customer-space-11);
  color: var(--customer-text-on-surface);
  text-align: left;
  background: var(--customer-surface);
  border: 0;
  border-radius: var(--customer-radius);
  box-shadow: var(--customer-shadow-card-raised);
  cursor: pointer;
  transition: var(--customer-transition-transform);
}
.menu-root__card:active {
  transform: var(--customer-transform-press);
}
.menu-root__card:focus-visible {
  outline: 2px solid var(--customer-color-focus);
  outline-offset: 2px;
}
.menu-root__name,
.menu-root__count {
  display: block;
}
.menu-root__content {
  display: grid;
  row-gap: var(--customer-space-2);
  min-width: 0;
  overflow-wrap: anywhere;
}
.menu-root__name {
  font-size: var(--customer-font-size-3xl);
  font-weight: var(--customer-font-weight-extrabold);
  letter-spacing: var(--customer-letter-spacing-slight);
  line-height: var(--customer-line-height-compact);
}
.menu-root__count {
  color: var(--customer-color-text-muted-on-surface);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
}
.menu-root__arrow {
  display: grid;
  width: var(--customer-size-control-md);
  height: var(--customer-size-control-md);
  flex: 0 0 auto;
  justify-self: end;
  place-items: center;
  color: var(--customer-text);
  background: var(--customer-background);
  border-radius: var(--customer-radius-round);
}
.menu-root__card :deep(.v-btn__content) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--customer-size-control-md);
  align-items: center;
  column-gap: var(--customer-space-7);
  justify-content: start;
  width: 100%;
  min-width: 0;
  text-align: left;
  white-space: normal;
}
@media (min-width: 768px) {
  .menu-root__header {
    width: 100%;
    max-width: var(--customer-size-content-detail);
    margin: 0 auto;
    padding-right: var(--customer-space-16);
    padding-left: var(--customer-space-16);
  }
  .menu-root__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    max-width: var(--customer-size-content-detail);
    margin: 0 auto;
    padding-right: var(--customer-space-16);
    padding-left: var(--customer-space-16);
  }
}
@media (min-width: 1024px) {
  .menu-root__header,
  .menu-root__grid {
    max-width: none;
    margin: 0;
  }
}
@media (min-width: 1280px) {
  .menu-root__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
