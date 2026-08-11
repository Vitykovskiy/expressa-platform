<template>
  <main class="customer-shell">
    <ShellNavigation
      :active-destination="props.activeDestination"
      :account-label="props.accountLabel"
      :cart-count="props.cartCount"
      :categories="props.categories"
      :is-authenticated="props.isAuthenticated"
      :selected-category-id="props.selectedCategoryId"
      :show-back="props.showBack"
      @back="emit('back')"
      @navigate="handleNavigate"
      @select-category="emit('selectCategory', $event)"
      @sign-out="emit('signOut')"
    />

    <section class="customer-shell__content">
      <ui-btn
        v-if="props.showBack"
        type="button"
        class="customer-shell__desktop-back"
        @click="emit('back')"
      >
        <ArrowLeft
          class="customer-shell__desktop-back-icon"
          aria-hidden="true"
        />
        Назад
      </ui-btn>
      <slot />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import UiBtn from "../shared/ui/btn/UiBtn.vue";
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

.customer-shell__desktop-back {
  display: none;
}

@media (min-width: 1024px) {
  .customer-shell {
    flex-direction: row;
    overflow-x: visible;
  }

  .customer-shell__content {
    width: auto;
    max-width: calc(var(--customer-content-width) * 2.5);
    margin: 0 auto;
    padding: var(--customer-space-5) var(--customer-space-17);
  }

  .customer-shell__desktop-back {
    align-self: start;
    display: inline-flex;
    align-items: center;
    min-height: 0;
    gap: var(--customer-space-5);
    margin-top: var(--customer-space-11);
    padding: var(--customer-space-5) var(--customer-space-8)
      var(--customer-space-5) var(--customer-space-6);
    color: var(--customer-text);
    background: var(--customer-surface-muted);
    border: 0;
    border-radius: var(--customer-radius-pill);
    font-size: var(--customer-font-size-sm);
    font-weight: var(--customer-font-weight-extrabold);
  }

  .customer-shell__desktop-back-icon {
    width: var(--customer-font-size-md);
    height: var(--customer-font-size-md);
  }
}
</style>
