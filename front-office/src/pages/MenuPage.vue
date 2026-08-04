<template>
  <section class="menu-page">
    <div v-if="isLoading" class="menu-page__state" role="status">
      <h1>Меню</h1>
      <ui-progress kind="circular" label="Загружаем меню" indeterminate />
      <p>Загружаем меню</p>
    </div>
    <div
      v-else-if="menuStore.status === 'error'"
      class="menu-page__state"
      role="alert"
    >
      <h1>Меню</h1>
      <p>{{ menuStore.errorMessage }}</p>
      <ui-btn type="button" @click="retry">Повторить</ui-btn>
    </div>
    <div
      v-else-if="menuStore.menu && menuStore.menu.categories.length === 0"
      class="menu-page__state"
      role="status"
    >
      <h1>Меню</h1>
      <p>Меню пока пустое</p>
    </div>
    <template v-else-if="menuStore.menu">
      <p
        v-if="!menuStore.menu.acceptsNewOrders"
        class="menu-page__notice"
        role="status"
      >
        Новые заказы временно не принимаются
      </p>
      <menu-flow
        :menu="menuStore.menu"
        @add="addConfigured"
        @change-level="menuLevel = $event"
      />
      <ui-btn
        v-if="menuLevel !== 'product'"
        class="menu-page__cart"
        :to="cartPageRoute.cart"
      >
        Корзина · {{ cartStore.itemCount }} ·
        {{ formatMinorAmount(cartStore.totalMinor) }}
      </ui-btn>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import MenuFlow from "../customer/pages/menu/MenuFlow.vue";
import { useCartStore } from "../customer/shared/model/cart.store";
import { useMenuStore } from "../customer/shared/model/menu.store";
import UiProgress from "../customer/shared/ui/progress/UiProgress.vue";
import UiBtn from "../customer/shared/ui/btn/UiBtn.vue";
import { formatMinorAmount } from "../customer/shared/model/money";
import { cartPageRoute } from "./CartPage.constants";

const menuStore = useMenuStore();
const cartStore = useCartStore();
const isLoading = computed(
  () => menuStore.status === "idle" || menuStore.status === "loading",
);
const menuLevel = ref<"root" | "category" | "product">("root");

onMounted(() => {
  void menuStore.load();
});
function retry(): void {
  void menuStore.load();
}
function addConfigured(
  item: Parameters<typeof cartStore.addConfigured>[0],
): void {
  cartStore.addConfigured(item);
}
</script>

<style scoped lang="scss">
.menu-page {
  min-height: 100%;
}
.menu-page__state {
  display: grid;
  gap: var(--customer-space-7);
  place-items: center;
  min-height: 50vh;
  padding: var(--customer-space-9);
  text-align: center;
}
.menu-page__notice {
  margin: var(--customer-space-7) var(--customer-space-9) 0;
  padding: var(--customer-space-6) var(--customer-space-8);
  color: var(--customer-text-on-surface);
  background: var(--customer-color-warning-surface);
  border-radius: var(--customer-radius);
  font-weight: var(--customer-font-weight-bold);
}
.menu-page__cart {
  position: fixed;
  right: var(--customer-space-9);
  bottom: var(--customer-space-9);
  z-index: 1;
}
</style>
