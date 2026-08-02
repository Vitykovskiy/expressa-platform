<template>
  <main class="page">
    <AppHeader title="Корзина" :cart-count="itemCount" @cart="emit('menu')" />
    <EmptyState
      v-if="items.length === 0"
      title="Корзина пуста"
      description="Добавьте товар из меню."
      action-label="Открыть меню"
      @action="emit('menu')"
    />
    <template v-else>
      <section class="lines" aria-label="Позиции корзины">
        <CartLine
          v-for="item in items"
          :key="item.id"
          v-bind="item"
          @update:quantity="updateQuantity(item.id, $event)"
          @remove="remove(item.id)"
        />
      </section>
      <CartSummary :items="itemCount" :total="total" />
      <p class="postpay">Оплата после получения заказа.</p>
      <BottomActionBar
        label="Перейти к оформлению"
        :detail="`${total.toLocaleString('ru-RU')} ₽`"
        @action="emit('checkout')"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import CartLine from "../domain-ui/Cart/CartLine.vue";
import CartSummary from "../domain-ui/Cart/CartSummary.vue";
import EmptyState from "../domain-ui/Feedback/EmptyState.vue";
import AppHeader from "../domain-ui/Navigation/AppHeader.vue";
import BottomActionBar from "../domain-ui/Navigation/BottomActionBar.vue";

export interface CartItem {
  id: string;
  name: string;
  details?: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
}
const props = defineProps<{ initialItems: readonly CartItem[] }>();
const emit = defineEmits<{
  menu: [];
  checkout: [];
  change: [items: CartItem[]];
}>();
const items = shallowRef<CartItem[]>(
  props.initialItems.map((item) => ({ ...item })),
);
const itemCount = computed(() =>
  items.value.reduce((count, item) => count + item.quantity, 0),
);
const total = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
);
function publish(): void {
  emit(
    "change",
    items.value.map((item) => ({ ...item })),
  );
}
function updateQuantity(id: string, quantity: number): void {
  items.value = items.value.map((item) =>
    item.id === id ? { ...item, quantity } : item,
  );
  publish();
}
function remove(id: string): void {
  items.value = items.value.filter((item) => item.id !== id);
  publish();
}
</script>

<style scoped>
.page,
.lines {
  display: grid;
  gap: var(--fo-space-3);
}
.page {
  min-height: 100%;
  background: var(--fo-surface-muted);
  color: var(--fo-text);
}
.lines,
.postpay {
  padding: 0 var(--fo-space-3);
}
.postpay {
  margin: 0;
  color: var(--fo-muted);
}
</style>
