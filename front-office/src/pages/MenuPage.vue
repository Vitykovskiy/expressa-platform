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
        :menu-shell-command="props.menuShellCommand"
        @add="addConfigured"
        @change-level="menuLevel = $event"
        @menu-screen-change="emit('menuScreenChange', $event)"
        @menu-shell-command-ack="emit('menuShellCommandAck', $event)"
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
import MenuFlow from "@/features/menu/MenuFlow.vue";
import type { MenuShellCommand } from "@/features/menu/MenuFlow.types";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import UiProgress from "@/shared/ui/customer/progress/UiProgress.vue";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import { formatMinorAmount } from "@/entities/customer/model/money";
import { cartPageRoute } from "./CartPage.constants";

const menuStore = useMenuStore();
const cartStore = useCartStore();
const props = defineProps<{
  menuShellCommand?: MenuShellCommand | null;
}>();
const emit = defineEmits<{
  menuScreenChange: [
    screen: import("@/features/menu/MenuFlow.types").MenuFlowScreen,
  ];
  menuShellCommandAck: [requestId: number];
}>();
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
  max-width: calc(100vw - var(--customer-space-9) * 2);
  box-sizing: border-box;
}
@media (min-width: 480px) and (max-width: 1023px) {
  .menu-page__cart {
    right: max(
      var(--customer-space-9),
      calc(
        (100vw - var(--customer-content-width)) / 2 + var(--customer-space-9)
      )
    );
  }
}
</style>
