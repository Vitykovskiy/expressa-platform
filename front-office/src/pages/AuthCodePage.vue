<template>
  <AuthScreen
    :state="authState"
    :is-loading="isLoading"
    :context-description="contextDescription"
    :otp="otp"
    :resend-remaining-seconds="resendRemainingSeconds"
    @back-to-phone="backToPhone"
    @send-code="resendOtp"
    @update-otp="otp = $event"
    @verify-otp="verifyOtp"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import { getSessionDependencies } from "../app/session.store.dependencies";
import AuthScreen from "@/features/auth/AuthScreen.vue";
import { authCodeRoute } from "./AuthCodePage.constants";
import type { AuthCodePageState } from "./AuthCodePage.types";

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const errorMessage = shallowRef("");
const isLoading = shallowRef(false);
const otp = shallowRef("");
const now = shallowRef(getSessionDependencies().now());
const resendTimer = setInterval(
  () => (now.value = getSessionDependencies().now()),
  1000,
);
const resendRemainingSeconds = computed(() => {
  const metadata = sessionStore.otpRequestMetadata;
  const requestedAt = sessionStore.otpRequestedAt;
  if (metadata === null || requestedAt === null) return 0;
  return Math.max(
    0,
    Math.ceil(
      (requestedAt + metadata.retryAfterSeconds * 1000 - now.value) / 1000,
    ),
  );
});
const contextDescription = computed(() => getContextDescription());
onBeforeUnmount(() => clearInterval(resendTimer));

if (!hasActiveOtpRequest()) {
  void router.replace({
    path: authCodeRoute.phone,
    query: {
      ...returnToQuery(),
      reason: authCodeRoute.expiredQuery,
    },
  });
}

const authState = computed<AuthCodePageState>(() => ({
  errorMessage: errorMessage.value,
  name: "",
  phone: sessionStore.pendingPhone ?? "",
  step: "otp",
  verified: false,
}));

async function verifyOtp(code: string = otp.value): Promise<void> {
  if (isLoading.value || sessionStore.pendingPhone === null) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await sessionStore.verifyOtp(sessionStore.pendingPhone, code);
    if (sessionStore.status !== "authenticated") return;
    await router.replace(returnTo());
  } catch {
    errorMessage.value = sessionStore.errorMessage ?? "";
  } finally {
    isLoading.value = false;
  }
}

async function resendOtp(): Promise<void> {
  if (
    isLoading.value ||
    sessionStore.pendingPhone === null ||
    resendRemainingSeconds.value > 0
  )
    return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await sessionStore.requestOtp(sessionStore.pendingPhone);
    otp.value = "";
    now.value = getSessionDependencies().now();
  } catch {
    errorMessage.value = sessionStore.errorMessage ?? "";
  } finally {
    isLoading.value = false;
  }
}

function backToPhone(): void {
  void router.replace({ path: authCodeRoute.phone, query: returnToQuery() });
}

function returnTo(): string {
  const returnTo = route.query.returnTo;

  return isInternalReturnTo(returnTo)
    ? returnTo
    : authCodeRoute.defaultReturnTo;
}

function returnToQuery(): { returnTo?: string } {
  const returnTo = route.query.returnTo;

  return isInternalReturnTo(returnTo) ? { returnTo } : {};
}

function isInternalReturnTo(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return false;
  }

  const path = new URL(value, window.location.origin).pathname;

  return path !== authCodeRoute.phone && path !== authCodeRoute.code;
}

function hasActiveOtpRequest(): boolean {
  return (
    sessionStore.pendingPhone !== null &&
    sessionStore.otpExpiresAt !== null &&
    getSessionDependencies().now() < sessionStore.otpExpiresAt
  );
}

function getContextDescription(): string | undefined {
  const returnTo = route.query.returnTo;
  if (!isInternalReturnTo(returnTo)) return undefined;

  const path = new URL(returnTo, window.location.origin).pathname;
  if (path === "/orders" || path.startsWith("/orders/")) {
    return "Подтвердите номер телефона, чтобы посмотреть историю заказов.";
  }
  if (path === "/cart") {
    return "Подтвердите номер телефона, чтобы оформить заказ.";
  }

  return undefined;
}
</script>
