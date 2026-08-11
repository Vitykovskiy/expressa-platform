<template>
  <AuthScreen
    :state="authState"
    @back-to-phone="backToPhone"
    @send-code="resendOtp"
    @verify-otp="verifyOtp"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
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
  step: isLoading.value ? "loading" : "otp",
  verified: false,
}));

async function verifyOtp(code: string): Promise<void> {
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
  if (isLoading.value || sessionStore.pendingPhone === null) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await sessionStore.requestOtp(sessionStore.pendingPhone);
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
</script>
