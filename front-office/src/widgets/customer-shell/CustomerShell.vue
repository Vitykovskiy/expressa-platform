<template>
  <main class="customer-shell">
    <ShellNavigation
      :active-destination="props.activeDestination"
      :account-label="props.accountLabel"
      :cart-count="props.cartCount"
      :categories="props.categories"
      :is-authenticated="props.isAuthenticated"
      :is-logout-pending="props.isLogoutPending"
      :selected-category-id="props.selectedCategoryId"
      @navigate="handleNavigate"
      @select-category="emit('selectCategory', $event)"
      @open-account="emit('openAccount')"
    />

    <section class="customer-shell__content">
      <slot />
    </section>
  </main>
</template>

<script setup lang="ts">
import ShellNavigation from "./ShellNavigation.vue";
import type { ShellNavigationDestination } from "./ShellNavigation.types";
import type {
  CustomerShellEmits,
  CustomerShellProps,
} from "./CustomerShell.types";

const props = defineProps<CustomerShellProps>();
const emit = defineEmits<CustomerShellEmits>();
defineSlots<{
  default(): unknown;
}>();

function handleNavigate(destination: ShellNavigationDestination): void {
  emit("navigate", destination);

  if (destination === "menu") emit("goMenu");
  if (destination === "auth") emit("openAuth");
  if (destination === "cart") emit("openCart");
  if (destination === "orders") emit("openOrders");
}
</script>

<style scoped lang="scss">
.customer-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100dvh;
  overflow-x: clip;
  color: var(--customer-text);
  background: var(--customer-background);
  font-family: var(--customer-font-family);
}

.customer-shell__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

@media (min-width: 1024px) {
  .customer-shell {
    flex-direction: row;
    overflow-x: visible;
  }

  .customer-shell__content {
    width: auto;
    max-width: var(--customer-size-shell-content);
    margin: 0 auto;
    padding: var(--customer-space-5) var(--customer-space-17);
  }
}
</style>
