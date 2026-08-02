<template>
  <div v-bind="$attrs" class="shell-navigation">
    <header class="shell-navigation__mobile-header">
      <div class="shell-navigation__header-actions">
        <ui-icon-btn
          v-if="props.activeDestination !== 'menu' || props.showBack"
          type="button"
          aria-label="Назад"
          @click="emit('back')"
        >
          <ArrowLeft aria-hidden="true" />
        </ui-icon-btn>
        <ui-icon-btn
          v-if="props.activeDestination !== 'menu' || props.showBack"
          type="button"
          aria-label="В меню"
          @click="emit('navigate', 'menu')"
        >
          <House aria-hidden="true" />
        </ui-icon-btn>
      </div>
      <span class="shell-navigation__brand">
        <Coffee class="shell-navigation__brand-icon" aria-hidden="true" />
        Ex-pressa
      </span>
      <div
        class="shell-navigation__header-actions shell-navigation__header-actions--end"
      >
        <ui-icon-btn
          type="button"
          :aria-label="accountControl.ariaLabel"
          @click="emit('navigate', accountControl.destination)"
        >
          <component :is="accountControl.icon" aria-hidden="true" />
        </ui-icon-btn>
        <ui-icon-btn
          type="button"
          class="shell-navigation__cart-button"
          aria-label="Корзина"
          @click="emit('navigate', 'cart')"
        >
          <ShoppingCart aria-hidden="true" />
          <ui-badge
            v-if="props.cartCount"
            class="shell-navigation__badge"
            tone="info"
          >
            {{ props.cartCount }}
          </ui-badge>
        </ui-icon-btn>
      </div>
    </header>

    <aside class="shell-navigation__sidebar">
      <ui-btn
        type="button"
        class="shell-navigation__brand shell-navigation__brand--button"
        @click="emit('navigate', 'menu')"
      >
        <Coffee class="shell-navigation__brand-icon" aria-hidden="true" />
        Ex-pressa
      </ui-btn>
      <nav class="shell-navigation__nav" aria-label="Основная навигация">
        <ui-btn
          v-for="item in navigationItems"
          :key="item.destination"
          :class="{
            'shell-navigation__nav-button--active':
              props.activeDestination === item.destination,
          }"
          type="button"
          @click="emit('navigate', item.destination)"
        >
          <component :is="item.icon" aria-hidden="true" />
          <span>{{ item.label }}</span>
          <ui-badge
            v-if="item.destination === 'cart' && props.cartCount"
            class="shell-navigation__badge"
            tone="info"
          >
            {{ props.cartCount }}
          </ui-badge>
        </ui-btn>
      </nav>
      <p class="shell-navigation__nav-title">Категории</p>
      <nav
        class="shell-navigation__nav shell-navigation__category-nav"
        aria-label="Категории"
      >
        <ui-btn
          v-for="item in props.categories"
          :key="item.id"
          :class="{
            'shell-navigation__nav-button--active':
              props.selectedCategoryId === item.id,
          }"
          type="button"
          @click="emit('selectCategory', item.id)"
        >
          {{ item.name }}
        </ui-btn>
      </nav>
      <div class="shell-navigation__spacer" />
      <ui-btn
        type="button"
        class="shell-navigation__account"
        @click="accountControl.action()"
      >
        <component :is="accountControl.icon" aria-hidden="true" />
        {{ accountControl.label }}
        <span
          v-if="accountControl.actionLabel"
          class="shell-navigation__account-action"
        >
          {{ accountControl.actionLabel }}
        </span>
      </ui-btn>
      <p class="shell-navigation__copyright">(c) Ex-pressa Customer</p>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import {
  ArrowLeft,
  Coffee,
  History,
  House,
  LogIn,
  ShoppingCart,
} from "lucide-vue-next";
import UiBadge from "../shared/ui/badge/UiBadge.vue";
import UiBtn from "../shared/ui/btn/UiBtn.vue";
import UiIconBtn from "../shared/ui/icon-btn/UiIconBtn.vue";
import type {
  ShellNavigationEmits,
  ShellNavigationItem,
  ShellNavigationProps,
} from "./ShellNavigation.types";

defineOptions({ inheritAttrs: false });

const props = defineProps<ShellNavigationProps>();
const emit = defineEmits<ShellNavigationEmits>();

const navigationItems = [
  { destination: "menu", label: "Меню", icon: House },
  { destination: "orders", label: "История", icon: History },
  { destination: "cart", label: "Корзина", icon: ShoppingCart },
] satisfies (ShellNavigationItem & { icon: Component })[];

const accountControl = computed(() => {
  if (props.isAuthenticated) {
    return {
      ariaLabel: "История заказов",
      destination: "orders" as const,
      icon: History,
      label: props.accountLabel,
      actionLabel: "Выйти",
      action: () => emit("signOut"),
    };
  }

  return {
    ariaLabel: "Подтвердить телефон",
    destination: "auth" as const,
    icon: LogIn,
    label: "Подтвердить телефон",
    actionLabel: "",
    action: () => emit("navigate", "auth"),
  };
});
</script>

<style scoped lang="scss">
.shell-navigation {
  display: contents;
}

.shell-navigation__mobile-header {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 0 0 calc(var(--customer-space-17) + var(--customer-space-9));
  height: calc(var(--customer-space-17) + var(--customer-space-9));
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--customer-space-9);
  background: var(--customer-background);
}

.shell-navigation__header-actions {
  display: flex;
  width: var(--customer-space-21);
  gap: var(--customer-space-3);
}

.shell-navigation__header-actions--end {
  justify-content: end;
}

.shell-navigation__header-actions .ui-icon-btn {
  position: relative;
  display: grid;
  width: calc(var(--customer-space-16) + var(--customer-space-3));
  height: calc(var(--customer-space-16) + var(--customer-space-3));
  place-items: center;
  color: var(--customer-text);
  background: var(--customer-surface-control);
  border: 0;
  border-radius: var(--customer-radius-round);
  font-weight: var(--customer-font-weight-black);
}

.shell-navigation__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--customer-space-4);
  color: var(--customer-text);
  font-size: var(--customer-font-size-2xl);
  font-weight: var(--customer-font-weight-black);
}

.shell-navigation__brand-icon {
  width: var(--customer-space-11);
  height: var(--customer-space-11);
}

.shell-navigation__brand--button {
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
  font-size: var(--customer-font-size-4xl);
}

.shell-navigation__badge {
  display: grid;
  min-width: var(--customer-font-size-xl);
  height: var(--customer-font-size-xl);
  place-items: center;
  padding: 0 var(--customer-space-3);
  color: var(--customer-text);
  background: var(--customer-primary);
  border-radius: var(--customer-radius-pill);
  font-size: var(--customer-font-size-caption);
  font-weight: var(--customer-font-weight-black);
}

.shell-navigation__cart-button .shell-navigation__badge {
  position: absolute;
  top: calc(var(--customer-space-1) * -1);
  right: calc(var(--customer-space-1) * -1);
}

.shell-navigation__sidebar {
  display: none;
}

@media (min-width: 1024px) {
  .shell-navigation__mobile-header {
    display: none;
  }

  .shell-navigation__sidebar {
    position: sticky;
    top: 0;
    display: flex;
    width: calc(var(--customer-space-21) * 3 + var(--customer-space-17));
    height: 100dvh;
    flex: 0 0 auto;
    flex-direction: column;
    padding: var(--customer-space-15) var(--customer-space-11);
    background: var(--customer-surface-sidebar);
    border-right: calc(var(--customer-space-1) / 2) solid
      var(--customer-border-subtle-on-brand);
  }

  .shell-navigation__nav {
    display: flex;
    flex-direction: column;
    gap: var(--customer-space-3);
    margin-top: var(--customer-space-16);
  }

  .shell-navigation__category-nav {
    margin-top: 0;
  }

  .shell-navigation__nav-title {
    margin: var(--customer-space-15) 0 var(--customer-space-6)
      var(--customer-space-7);
    color: var(--customer-text-faint-on-brand);
    font-size: var(--customer-font-size-2xs);
    font-weight: var(--customer-font-weight-extrabold);
    letter-spacing: var(--customer-letter-spacing-overline);
    text-transform: uppercase;
  }

  .shell-navigation__nav .ui-btn {
    display: flex;
    min-height: var(--customer-size-control-xl);
    align-items: center;
    gap: var(--customer-space-7);
    padding: var(--customer-space-6) var(--customer-space-7);
    color: var(--customer-text-strong-on-brand);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: var(--customer-radius-xs);
    font-size: var(--customer-font-size-body);
    font-weight: var(--customer-font-weight-extrabold);
  }

  .shell-navigation__nav .shell-navigation__nav-button--active {
    color: var(--customer-background);
    background: var(--customer-surface);
  }

  .shell-navigation__nav .shell-navigation__badge {
    margin-left: auto;
  }

  .shell-navigation__spacer {
    flex: 1;
  }

  .shell-navigation__account {
    display: flex;
    align-items: center;
    gap: var(--customer-space-5);
    width: 100%;
    margin-bottom: var(--customer-space-7);
    padding: var(--customer-space-7);
    color: var(--customer-text-muted-on-brand);
    text-align: left;
    background: var(--customer-surface-note);
    border: calc(var(--customer-space-1) / 2) solid
      var(--customer-surface-control);
    border-radius: var(--customer-radius-xs);
    font-size: var(--customer-font-size-xs);
    font-weight: var(--customer-font-weight-extrabold);
  }

  .shell-navigation__account-action {
    margin-left: auto;
    font-size: var(--customer-font-size-2xs);
  }

  .shell-navigation__copyright {
    margin: 0 var(--customer-space-7);
    color: var(--customer-text-faint-on-brand);
    font-size: var(--customer-font-size-2xs);
    font-weight: var(--customer-font-weight-bold);
  }
}
</style>
