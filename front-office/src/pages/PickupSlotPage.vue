<template>
  <SlotPickerScreen
    :choices="choices"
    :selection="selection"
    :loading="loading"
    :busy="busy"
    :locked="locked"
    :can-submit="canSubmit"
    :message="message"
    :notification="notification"
    @select="select"
    @confirm="submit"
    @refresh="load"
    @back="back"
    @dismiss-notification="notification = null"
  />
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, shallowRef } from "vue";
import { useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { useCheckoutStore } from "@/features/checkout/checkout.store";
import {
  checkoutErrorCodes,
  checkoutStatuses,
} from "@/features/checkout/checkout.store.constants";
import SlotPickerScreen from "@/features/checkout/SlotPickerScreen.vue";
import { apiClientKey } from "@/shared/api/client";
import { createPickupSlotsApi } from "@/shared/api/pickup-slots.api";
import { usePickupSelection } from "@/features/checkout/usePickupSelection";

const client = inject(apiClientKey);

if (client === undefined) {
  throw new Error("Pickup API is not configured");
}

const pickupApi = createPickupSlotsApi(client);
const router = useRouter();
const session = useSessionStore();
const cart = useCartStore();
const checkout = useCheckoutStore();
const notification = shallowRef<string | null>(null);
let mounted = true;
const busy = computed(() => checkout.status === checkoutStatuses.submitting);
const pendingRetry = computed(
  () =>
    checkout.attempt !== null &&
    checkout.errorCode === checkoutErrorCodes.network,
);
const locked = computed(() => busy.value || pendingRetry.value);
const pickup = usePickupSelection({
  locked,
  loadAvailability: () => {
    if (session.accessToken === null) {
      throw new Error("Customer session is required");
    }

    return session.readProtected(
      (token) => pickupApi.load(token),
      () => mounted,
      () => {
        notification.value = null;
      },
    );
  },
});
const { choices, loading, load, select } = pickup;
const selection = computed(() =>
  pendingRetry.value
    ? (checkout.attempt?.request.pickupSlotStart ?? "automatic")
    : pickup.selection.value,
);
const message = computed(() =>
  pendingRetry.value
    ? "Не удалось получить ответ. Повторите оформление, чтобы узнать результат. Корзина сохранена."
    : pickup.message.value,
);
const canSubmit = computed(
  () => !busy.value && (pendingRetry.value || pickup.canSubmit.value),
);

onMounted(async () => {
  if (cart.items.length === 0) {
    await router.replace("/cart");

    return;
  }

  if (pendingRetry.value) {
    return;
  }

  if (
    checkout.errorCode === checkoutErrorCodes.pickupUnavailable ||
    checkout.errorCode === checkoutErrorCodes.capacityUnavailable
  ) {
    await pickup.recoverConflict(checkout.rejectedPickupSlotStart);

    return;
  }

  await load();
});

onUnmounted(() => {
  mounted = false;
});

async function submit(): Promise<void> {
  if (!canSubmit.value || session.accessToken === null) {
    return;
  }

  const requestedStart = selection.value;

  if (pendingRetry.value) {
    await checkout.retry(session.accessToken);
  } else {
    const submission = {
      accessToken: session.accessToken,
      cartItems: cart.items,
      ...(requestedStart === "automatic" || requestedStart === null
        ? {}
        : { pickupSlotStart: requestedStart }),
    };

    if (checkout.status === checkoutStatuses.reconfirmationRequired) {
      await checkout.reconfirm(submission);
    } else {
      await checkout.confirm(submission);
    }
  }

  if (
    checkout.status === checkoutStatuses.succeeded &&
    checkout.order !== null
  ) {
    const orderId = checkout.order.id;

    cart.clear();
    await router.push(`/orders/${orderId}`);

    return;
  }

  if (
    checkout.errorCode === checkoutErrorCodes.pickupUnavailable ||
    checkout.errorCode === checkoutErrorCodes.capacityUnavailable
  ) {
    notification.value = null;
    await pickup.recoverConflict(requestedStart);
    notification.value = checkout.errorMessage;

    return;
  }

  if (
    checkout.errorCode === checkoutErrorCodes.totalChanged ||
    checkout.errorCode === checkoutErrorCodes.itemUnavailable ||
    checkout.errorCode === checkoutErrorCodes.intakeClosed
  ) {
    await router.push("/cart");

    return;
  }

  notification.value = checkout.errorMessage;
}

function back(): void {
  if (!busy.value) {
    void router.push("/cart");
  }
}
</script>
