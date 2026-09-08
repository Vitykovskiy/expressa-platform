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
      <ui-btn class="menu-page__retry" type="button" @click="retry"
        >Повторить</ui-btn
      >
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
        @menu-screen-change="emit('menuScreenChange', $event)"
        @menu-shell-command-ack="emit('menuShellCommandAck', $event)"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import MenuFlow from "@/features/menu/MenuFlow.vue";
import type { MenuShellCommand } from "@/features/menu/MenuFlow.types";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import UiProgress from "@/shared/ui/customer/progress/UiProgress.vue";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";

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
  gap: 0;
  padding: var(--customer-space-13) var(--customer-space-9);
}
.menu-page__state > * {
  min-width: 0;
}
.menu-page__state h1,
.menu-page__state p {
  margin: 0;
  overflow-wrap: anywhere;
}
.menu-page__state h1 {
  margin-bottom: var(--customer-space-9);
}
.menu-page__state > .ui-progress + p {
  margin-top: var(--customer-space-7);
}
.menu-page__state p + .menu-page__retry {
  margin-top: var(--customer-space-7);
}
.menu-page__retry {
  width: fit-content;
  min-height: 44px;
  padding: 0 var(--customer-space-9);
  color: var(--customer-color-text-on-brand);
  background: var(--customer-color-action-primary);
  border-radius: var(--customer-radius);
}
.menu-page__retry:focus-visible {
  outline: 2px solid var(--customer-color-focus);
  outline-offset: 2px;
}
@media (min-width: 1024px) {
  .menu-page__state {
    padding-inline: 0;
  }
}
.menu-page__notice {
  margin: var(--customer-space-7) var(--customer-space-9) 0;
  padding: var(--customer-space-6) var(--customer-space-8);
  color: var(--customer-text-on-surface);
  background: var(--customer-color-warning-surface);
  border-radius: var(--customer-radius);
  font-weight: var(--customer-font-weight-bold);
}
</style>
