<template>
  <AuthScreen
    :state="authState"
    :name-readonly="hasCanonicalName"
    :context-description="contextDescription"
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
import { ApiError } from "@/shared/api/client";

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
const hasCanonicalName = computed(
  () => registration.canonicalName.value !== null,
);
const submittedName = computed(
  () => registration.canonicalName.value ?? name.value,
);
const contextDescription = computed(() =>
  hasCanonicalName.value ? customerRegistrationMessages.confirmName : undefined,
);
const authState = computed<AuthState>(() => ({
  step: "register",
  name: submittedName.value,
  phone: registration.phone.value,
  verified: true,
  errorMessage: errorMessage.value,
}));

watch([registration.accountId, registration.generation], () => {
  name.value = "";
  errorMessage.value = "";
});

onBeforeUnmount(() => {
  mounted = false;
});

function updateName(value: string): void {
  if (hasCanonicalName.value || registration.pending.value) {
    return;
  }

  name.value = value;
  errorMessage.value = "";
}

async function submitName(): Promise<void> {
  if (registration.pending.value || submittedName.value.trim() === "") {
    return;
  }

  const isCurrentOperation = registration.captureOperation();
  errorMessage.value = "";

  try {
    const saved = await registration.complete(submittedName.value.trim());
    if (!mounted || !saved || !isCurrentOperation()) {
      return;
    }
    await router.replace(
      getSafeAuthReturnTo(route.query.returnTo) ?? routePaths.home,
    );
  } catch (error) {
    if (mounted && isCurrentOperation()) {
      if (error instanceof ApiError && error.code === "USER_NAME_CONFLICT") {
        errorMessage.value = customerRegistrationMessages.nameConflict;
      } else if (error instanceof ApiError && error.status === 400) {
        errorMessage.value = customerRegistrationMessages.saveFailed;
      } else {
        errorMessage.value = customerRegistrationMessages.resultUnknown;
      }
    }
  }
}
</script>
