<template>
  <CartScreenEditor
    v-if="editingItem"
    :key="editingItem.id"
    :item="editingItem"
    @cancel="closeEditor"
    @save="saveItem"
  />
  <CartScreen
    v-else
    v-bind="screenProps"
    @edit-item="editItem"
    @checkout="checkout"
    @continue-shopping="continueShopping"
    @reconfirm="reconfirm"
    @recheck-availability="recheckAvailability"
    @remove-item="removeItem"
    @update-quantity="updateQuantity"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from "vue";
import { useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import CartScreen from "@/features/checkout/CartScreen.vue";
import CartScreenEditor from "@/features/checkout/CartScreenEditor.vue";
import type {
  CartIntakeRecovery,
  CartScreenProps,
} from "@/features/checkout/CartScreen.types";
import {
  checkoutErrorCodes,
  checkoutStatuses,
} from "@/features/checkout/checkout.store.constants";
import { useCheckoutStore } from "@/features/checkout/checkout.store";
import { useCartStore } from "@/entities/customer/model/cart.store";
import type { ConfiguredCartItemDraft } from "@/entities/customer/model/customer.types";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import { cartPageMessages, cartPageRoute } from "./CartPage.constants";

const router = useRouter();
const cartStore = useCartStore();
const checkoutStore = useCheckoutStore();
const menuStore = useMenuStore();
const sessionStore = useSessionStore();
const editingItemId = shallowRef<string | null>(null);
const cartListScrollTop = shallowRef(0);
const confirmedIntakeRefusal = shallowRef(false);
const intakeRecheckPending = shallowRef(false);
const intakeRecheckFailed = shallowRef(false);
const intakeRecovery = computed<CartIntakeRecovery>(() => ({
  status:
    intakeRecheckPending.value || menuStore.status === "loading"
      ? "pending"
      : intakeRecheckFailed.value || menuStore.status === "error"
        ? "failed"
        : "idle",
  confirmedClosed:
    confirmedIntakeRefusal.value ||
    menuStore.menu?.acceptsNewOrders === false ||
    checkoutStore.errorCode === checkoutErrorCodes.intakeClosed,
}));
const canCreateNewOrder = computed(
  () =>
    menuStore.menu?.acceptsNewOrders === true &&
    !intakeRecovery.value.confirmedClosed &&
    intakeRecovery.value.status === "idle",
);

const editingItem = computed(
  () => cartStore.items.find((item) => item.id === editingItemId.value) ?? null,
);

const screenProps = computed<CartScreenProps>(() => {
  const acceptsNewOrders =
    checkoutStore.attempt !== null || canCreateNewOrder.value;
  const requiresPhoneConfirmation = sessionStore.status !== "authenticated";

  if (checkoutStore.status === checkoutStatuses.reconfirmationRequired) {
    return {
      acceptsNewOrders,
      intakeRecovery: intakeRecovery.value,
      listScrollTop: cartListScrollTop.value,
      itemsLocked: checkoutStore.attempt !== null,
      checkoutState: checkoutStatuses.reconfirmationRequired,
      errorMessage: acceptsNewOrders
        ? checkoutStore.errorMessage
        : cartPageMessages.intakeClosed,
      items: cartStore.items,
      requiresPhoneConfirmation,
      reconfirmedTotalRub: getReconfirmedTotalRub(),
      unavailableItemIds: checkoutStore.unavailableCartItemIds,
    };
  }

  return {
    acceptsNewOrders,
    intakeRecovery: intakeRecovery.value,
    listScrollTop: cartListScrollTop.value,
    itemsLocked: checkoutStore.attempt !== null,
    checkoutState: checkoutStore.status,
    errorMessage: !acceptsNewOrders
      ? cartPageMessages.intakeClosed
      : checkoutStore.errorMessage,
    items: cartStore.items,
    requiresPhoneConfirmation,
    unavailableItemIds: checkoutStore.unavailableCartItemIds,
  };
});

onUnmounted(() => {
  cartStore.clearRepeatWarnings();
});

function editItem(itemId: string, listScrollTop: number): void {
  if (checkoutStore.attempt !== null) {
    return;
  }

  cartListScrollTop.value = listScrollTop;
  editingItemId.value = itemId;
}

function closeEditor(): void {
  editingItemId.value = null;
}

function saveItem(draft: ConfiguredCartItemDraft): void {
  if (editingItemId.value === null) {
    return;
  }

  if (cartStore.updateConfigured(editingItemId.value, draft)) {
    checkoutStore.reset();
  }

  void closeEditor();
}

function removeItem(itemId: string): void {
  if (checkoutStore.attempt !== null) {
    return;
  }

  checkoutStore.reset();
  cartStore.replace(cartStore.items.filter((item) => item.id !== itemId));
}

function updateQuantity(itemId: string, quantity: number): void {
  if (checkoutStore.attempt !== null) {
    return;
  }

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
  if (!canCreateNewOrder.value && checkoutStore.attempt === null) {
    return;
  }

  if (
    sessionStore.status !== "authenticated" ||
    sessionStore.accessToken === null
  ) {
    await router.push({
      path: cartPageRoute.authPhone,
      query: { returnTo: "/checkout/pickup" },
    });

    return;
  }

  await router.push("/checkout/pickup");
}

async function reconfirm(): Promise<void> {
  await router.push("/checkout/pickup");
}

async function recheckAvailability(): Promise<void> {
  if (checkoutStore.attempt !== null || intakeRecheckPending.value) {
    return;
  }

  confirmedIntakeRefusal.value = intakeRecovery.value.confirmedClosed;
  intakeRecheckPending.value = true;
  intakeRecheckFailed.value = false;
  await menuStore.load(true);
  if (menuStore.menu === null || menuStore.status !== "ready") {
    intakeRecheckFailed.value = true;
  } else {
    confirmedIntakeRefusal.value = !menuStore.menu.acceptsNewOrders;
    if (
      menuStore.menu.acceptsNewOrders &&
      checkoutStore.errorCode === checkoutErrorCodes.intakeClosed
    ) {
      checkoutStore.reset();
    }
  }

  intakeRecheckPending.value = false;
}

onMounted(() => {
  if (menuStore.menu === null && menuStore.status !== "loading") {
    void recheckAvailability();
  }
});

function getReconfirmedTotalRub(): number {
  if (checkoutStore.reconfirmedTotal === null) {
    throw new Error(cartPageMessages.invalidReconfirmedTotal);
  }

  return checkoutStore.reconfirmedTotal;
}
</script>
