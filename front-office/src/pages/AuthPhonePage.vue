<template>
  <AuthScreen
    :state="authState"
    :is-loading="isLoading"
    :context-description="contextDescription"
    otp=""
    :resend-remaining-seconds="0"
    @send-code="requestOtp"
    @update-phone="updatePhone"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import AuthScreen from "@/features/auth/AuthScreen.vue";
import { getSafeAuthReturnTo } from "@/shared/lib/auth-return";
import { authPhoneRoute } from "./AuthPhonePage.constants";
import type { AuthPhonePageState } from "./AuthPhonePage.types";

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const phone = shallowRef(sessionStore.pendingPhone ?? "");
const errorMessage = shallowRef(
  route.query.reason === authPhoneRoute.expiredQuery
    ? "Срок действия кода истёк. Запросите новый код."
    : "",
);
const isLoading = shallowRef(false);
const contextDescription = computed(() => getContextDescription());

const authState = computed<AuthPhonePageState>(() => ({
  errorMessage: errorMessage.value,
  name: "",
  phone: phone.value,
  step: "phone",
  verified: false,
}));

function updatePhone(value: string): void {
  phone.value = value;
  errorMessage.value = "";
}

async function requestOtp(): Promise<void> {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await sessionStore.requestOtp(phone.value);
    await router.push({ path: authPhoneRoute.code, query: returnToQuery() });
  } catch {
    errorMessage.value = sessionStore.errorMessage ?? "";
  } finally {
    isLoading.value = false;
  }
}

function returnToQuery(): { returnTo?: string } {
  const returnTo = route.query.returnTo;

  const safeReturnTo = getSafeAuthReturnTo(returnTo);
  return safeReturnTo === undefined ? {} : { returnTo: safeReturnTo };
}

function getContextDescription(): string | undefined {
  const returnTo = route.query.returnTo;
  const safeReturnTo = getSafeAuthReturnTo(returnTo);
  if (safeReturnTo === undefined) return undefined;

  const path = new URL(safeReturnTo, window.location.origin).pathname;
  if (path === "/orders" || path.startsWith("/orders/")) {
    return "Подтвердите номер, чтобы посмотреть историю заказов.";
  }
  if (path === "/cart") {
    return "Подтвердите номер, чтобы оформить заказ.";
  }

  return undefined;
}
</script>
