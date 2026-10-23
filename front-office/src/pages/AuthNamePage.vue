<template>
  <AuthScreen
    :state="authState"
    :is-loading="registration.pending.value"
    otp=""
    :resend-remaining-seconds="0"
    @update-name="updateName"
    @submit-name="submitName"
  />
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  customerRegistrationKey,
  customerRegistrationMessages,
} from "@/features/auth/customer-registration.context.constants";
import { routePaths } from "@/shared/config/customer-routes.constants";
import type { AuthState } from "@/entities/customer/model/customer.types";
import AuthScreen from "@/features/auth/AuthScreen.vue";
import { getSafeAuthReturnTo } from "@/shared/lib/auth-return";

const route = useRoute();
const router = useRouter();
const registrationContext = inject(customerRegistrationKey);
if (registrationContext === undefined) {
  throw new Error(customerRegistrationMessages.notConfigured);
}
const registration = registrationContext;
const name = shallowRef("");
const errorMessage = shallowRef("");
let mounted = true;
const authState = computed<AuthState>(() => ({
  step: "register",
  name: name.value,
  phone: registration.phone.value,
  verified: true,
  errorMessage: errorMessage.value,
}));

watch(registration.accountId, () => {
  name.value = "";
  errorMessage.value = "";
});

onBeforeUnmount(() => {
  mounted = false;
});

function updateName(value: string): void {
  name.value = value;
  errorMessage.value = "";
}

async function submitName(): Promise<void> {
  if (registration.pending.value || name.value.trim() === "") {
    return;
  }
  const isCurrentOperation = registration.captureOperation();
  errorMessage.value = "";

  try {
    const saved = await registration.complete(name.value);
    if (!mounted || !saved || !isCurrentOperation()) {
      return;
    }
    await router.replace(
      getSafeAuthReturnTo(route.query.returnTo) ?? routePaths.home,
    );
  } catch {
    if (mounted && isCurrentOperation()) {
      errorMessage.value = customerRegistrationMessages.saveFailed;
    }
  }
}
</script>
