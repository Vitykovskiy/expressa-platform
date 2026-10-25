<template>
  <main ref="entry" class="auth-page" tabindex="-1">
    <AuthPending v-if="showPending" />
    <AuthCard
      v-else
      :step="step"
      :phone="visiblePhone"
      :code="code"
      :phone-invalid="phoneInvalid"
      :can-send="canSend"
      :can-confirm="canConfirm"
      @phone-changed="setPhone"
      @code-changed="setCode"
      @send-requested="sendCode"
      @confirm-requested="confirmCode"
      @change-number-requested="changeNumber"
      @invalid-phone-submitted="rejectPhone"
    />
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  useTemplateRef,
  watch,
} from "vue";
import AuthCard from "../../features/auth/ui/AuthCard.vue";
import AuthPending from "../../features/auth/ui/AuthPending.vue";
import { useAuthEntry } from "../../features/auth/model/useAuthEntry";
import type {
  AuthPageElement,
  AuthPageEmits,
  AuthPageProps,
} from "./AuthPage.types";

const props = defineProps<AuthPageProps>();
const emit = defineEmits<AuthPageEmits>();
const entry = useTemplateRef<AuthPageElement>("entry");
let isPageActive = false;

const {
  step,
  phone,
  shownPhone,
  code,
  phoneInvalid,
  pending,
  canSend,
  canConfirm,
  setPhone,
  setCode,
  rejectPhone,
  sendCode,
  confirmCode,
  changeNumber,
} = useAuthEntry(
  (message) => emit("error", message),
  () => emit("authenticated"),
);

const showPending = computed(() => props.restoring || pending.value);
const visiblePhone = computed(() =>
  step.value === "phone" ? phone.value : shownPhone.value,
);

async function focusActiveEntry() {
  await nextTick();

  // За время обновления DOM KeepAlive мог скрыть вход; фокус остаётся в рабочем разделе.
  if (!isPageActive || entry.value === null) {
    return;
  }

  const input = entry.value.querySelector("input");

  if (input !== null) {
    input.focus();

    return;
  }

  entry.value.focus();
}

onActivated(() => {
  isPageActive = true;
  focusActiveEntry();
});

onDeactivated(() => {
  isPageActive = false;
});

watch(() => [props.restoring, pending.value, step.value], focusActiveEntry, {
  flush: "post",
});
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 24px;
  background: var(--color-background);
}
</style>
