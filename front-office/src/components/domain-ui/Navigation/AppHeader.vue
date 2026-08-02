<template>
  <header class="app-header">
    <button
      class="app-header-menu"
      aria-label="Открыть меню"
      type="button"
      @click="emit('menu')"
    >
      ☰
    </button>
    <strong class="app-header-title">{{ title ?? "Expressa" }}</strong>
    <button
      class="app-header-cart"
      :aria-label="cartLabel"
      type="button"
      @click="emit('cart')"
    >
      Корзина
      <b v-if="cartCount" class="app-header-count">{{ cartCount }}</b>
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "FoAppHeader" });

const props = defineProps<{ title?: string; cartCount?: number }>();
const emit = defineEmits<{ cart: []; menu: [] }>();

const cartLabel = computed(() => `Корзина: ${props.cartCount ?? 0}`);
</script>

<style scoped>
.app-header {
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--fo-space-2);
  padding: 0 var(--fo-space-3);
  border-bottom: 1px solid var(--fo-border);
  color: var(--fo-text);
  background: var(--fo-surface);
  font: 700 1.125rem/1.2 var(--fo-font);
}

.app-header-menu,
.app-header-cart {
  display: inline-flex;
  min-width: 2.75rem;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: var(--fo-space-1);
  border: 0;
  color: var(--fo-brand-dark);
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.app-header-menu {
  font-size: 1.35rem;
}

.app-header-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header-count {
  display: inline-grid;
  min-width: 1.25rem;
  height: 1.25rem;
  place-items: center;
  border-radius: 50%;
  color: var(--fo-surface);
  background: var(--fo-brand);
  font-size: 0.75rem;
}
</style>
