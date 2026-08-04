<template>
  <CartScreen
    :items="cartStore.items"
    @checkout="checkout"
    @continue-shopping="continueShopping"
    @remove-item="removeItem"
    @update-quantity="updateQuantity"
  />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import CartScreen from "../customer/pages/checkout/CartScreen.vue";
import { useCartStore } from "../customer/shared/model/cart.store";
import { cartPageRoute } from "./CartPage.constants";

const router = useRouter();
const cartStore = useCartStore();
const sessionStore = useSessionStore();

function removeItem(itemId: string): void {
  cartStore.replace(cartStore.items.filter((item) => item.id !== itemId));
}

function updateQuantity(itemId: string, quantity: number): void {
  cartStore.replace(
    cartStore.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    ),
  );
}

function continueShopping(): void {
  void router.push(cartPageRoute.menu);
}

function checkout(): void {
  if (sessionStore.status === "authenticated") return;

  void router.push({
    path: cartPageRoute.authPhone,
    query: { returnTo: cartPageRoute.cart },
  });
}
</script>
