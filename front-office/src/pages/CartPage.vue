<template>
  <CartScreen
    v-bind="screenProps"
    @checkout="checkout"
    @continue-shopping="continueShopping"
    @reconfirm="reconfirm"
    @remove-item="removeItem"
    @update-quantity="updateQuantity"
  />
</template>

<script setup lang="ts">
import { computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import CartScreen from "@/features/checkout/CartScreen.vue";
import type { CartScreenProps } from "@/features/checkout/CartScreen.types";
import {
  checkoutErrorCodes,
  checkoutStatuses,
} from "@/features/checkout/checkout.store.constants";
import { useCheckoutStore } from "@/features/checkout/checkout.store";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import { cartPageMessages, cartPageRoute } from "./CartPage.constants";

const router = useRouter();
const cartStore = useCartStore();
const checkoutStore = useCheckoutStore();
const menuStore = useMenuStore();
const sessionStore = useSessionStore();
const screenProps = computed<CartScreenProps>(() => {
  const acceptsNewOrders = menuStore.menu?.acceptsNewOrders !== false;

  if (checkoutStore.status === checkoutStatuses.reconfirmationRequired) {
    return {
      acceptsNewOrders,
      checkoutState: checkoutStatuses.reconfirmationRequired,
      errorMessage: acceptsNewOrders
        ? checkoutStore.errorMessage
        : cartPageMessages.intakeClosed,
      items: cartStore.items,
      reconfirmedTotalRub: getReconfirmedTotalRub(),
      repeatWarnings: cartStore.repeatWarnings,
      unavailableItemIds: checkoutStore.unavailableCartItemIds,
    };
  }

  return {
    acceptsNewOrders,
    checkoutState: checkoutStore.status,
    errorMessage: !acceptsNewOrders
      ? cartPageMessages.intakeClosed
      : checkoutStore.errorMessage,
    items: cartStore.items,
    repeatWarnings: cartStore.repeatWarnings,
    unavailableItemIds: checkoutStore.unavailableCartItemIds,
  };
});

onUnmounted(() => {
  cartStore.clearRepeatWarnings();
});

function removeItem(itemId: string): void {
  checkoutStore.reset();
  cartStore.replace(cartStore.items.filter((item) => item.id !== itemId));
}

function updateQuantity(itemId: string, quantity: number): void {
  checkoutStore.reset();
  cartStore.replace(
    cartStore.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    ),
  );
}

function continueShopping(): void {
  void router.push(cartPageRoute.menu);
}

async function checkout(): Promise<void> {
  if (menuStore.menu?.acceptsNewOrders === false) return;

  if (
    sessionStore.status !== "authenticated" ||
    sessionStore.accessToken === null
  ) {
    await router.push({
      path: cartPageRoute.authPhone,
      query: { returnTo: cartPageRoute.cart },
    });
    return;
  }

  if (checkoutStore.errorCode === checkoutErrorCodes.network) {
    await checkoutStore.retry(sessionStore.accessToken);
  } else {
    await checkoutStore.confirm({
      ["accessToken"]: sessionStore.accessToken,
      cartItems: cartStore.items,
    });
  }

  await finishCheckout();
}

async function reconfirm(): Promise<void> {
  if (
    menuStore.menu?.acceptsNewOrders === false ||
    sessionStore.accessToken === null
  ) {
    return;
  }

  await checkoutStore.reconfirm({
    ["accessToken"]: sessionStore.accessToken,
    cartItems: cartStore.items,
  });

  await finishCheckout();
}

async function finishCheckout(): Promise<void> {
  if (
    checkoutStore.status !== checkoutStatuses.succeeded ||
    checkoutStore.order === null
  ) {
    return;
  }

  const orderId = checkoutStore.order.id;
  cartStore.clear();
  await router.push(`${cartPageRoute.orders}/${orderId}`);
}

function getReconfirmedTotalRub(): number {
  if (checkoutStore.reconfirmedTotal === null) {
    throw new Error(cartPageMessages.invalidReconfirmedTotal);
  }

  return checkoutStore.reconfirmedTotal;
}
</script>
