<template>
  <AuthScreen
    :state="authState"
    @send-code="requestOtp"
    @update-phone="updatePhone"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import AuthScreen from "@/features/auth/AuthScreen.vue";
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

const authState = computed<AuthPhonePageState>(() => ({
  errorMessage: errorMessage.value,
  name: "",
  phone: phone.value,
  step: isLoading.value ? "loading" : "phone",
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

  return path !== authPhoneRoute.phone && path !== authPhoneRoute.code;
}
</script>
