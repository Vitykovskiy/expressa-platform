import { computed, onScopeDispose, readonly, shallowRef, watch } from "vue";
import { useSessionStore } from "../session/session.store";
import { requestOtp } from "./auth.api";
import {
  AUTH_MESSAGES,
  COOLDOWN_SECOND_MS,
  OTP_PATTERN,
} from "./useAuthEntry.constants";
import type { AuthStep } from "./useAuthEntry.types";
import { displayPhone, normalizePhone } from "./phone";

export function useAuthEntry(
  reportError: (message: string) => void,
  authenticated: () => void,
) {
  const session = useSessionStore();
  const step = shallowRef<AuthStep>("phone");
  const phone = shallowRef("");
  const requestedPhone = shallowRef("");
  const code = shallowRef("");
  const phoneInvalid = shallowRef(false);
  const pending = shallowRef(false);
  const coolingDown = shallowRef(false);
  const confirmationBlocked = shallowRef(false);
  let cooldownDeadlineMs = 0;
  let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
  let activeOtpRequest: AbortController | null = null;
  let disposed = false;
  // При pending logout помним staff-сеанс до подтверждённого завершения выхода.
  let hadStaffSession = false;

  const normalizedPhone = computed(() => normalizePhone(phone.value));
  const shownPhone = computed(() =>
    requestedPhone.value ? displayPhone(requestedPhone.value) : phone.value,
  );
  const canSend = computed(
    () =>
      !pending.value &&
      !coolingDown.value &&
      (step.value === "expired" || normalizedPhone.value !== null),
  );
  const canConfirm = computed(
    () =>
      !pending.value &&
      !confirmationBlocked.value &&
      OTP_PATTERN.test(code.value),
  );

  function setPhone(value: string) {
    phone.value = value;
    phoneInvalid.value = false;
  }

  function setCode(value: string) {
    code.value = value.replace(/\D/g, "").slice(0, 6);

    if (step.value === "invalid-code") {
      step.value = "otp";
    }
  }

  function rejectPhone() {
    if (normalizedPhone.value === null) {
      phoneInvalid.value = true;
    }
  }

  function imposeCooldown(seconds: number) {
    clearTimeout(cooldownTimer);
    cooldownDeadlineMs = Math.max(
      cooldownDeadlineMs,
      Date.now() + seconds * COOLDOWN_SECOND_MS,
    );
    coolingDown.value = cooldownDeadlineMs > Date.now();
    cooldownTimer = setTimeout(
      () => {
        coolingDown.value = false;
      },
      Math.max(0, cooldownDeadlineMs - Date.now()),
    );
  }

  async function sendCode() {
    const targetPhone =
      step.value === "expired" ? requestedPhone.value : normalizedPhone.value;

    if (targetPhone === null || targetPhone === "") {
      rejectPhone();

      return;
    }

    if (pending.value || coolingDown.value) {
      return;
    }

    const controller = new AbortController();

    reportError("");
    activeOtpRequest = controller;
    pending.value = true;

    const outcome = await requestOtp(targetPhone, controller.signal);

    // После завершения scope ответ не должен менять ввод, ошибку или pending.
    if (disposed || activeOtpRequest !== controller) {
      return;
    }

    activeOtpRequest = null;
    pending.value = false;

    switch (outcome.kind) {
      case "sent":
        requestedPhone.value = targetPhone;
        code.value = "";
        confirmationBlocked.value = false;
        step.value = "otp";
        imposeCooldown(outcome.retryAfterSeconds);

        return;
      case "rate-limited":
        if (outcome.retryAfterSeconds !== null) {
          imposeCooldown(outcome.retryAfterSeconds);
        }

        reportError(AUTH_MESSAGES.cooldown);

        return;
      case "invalid-phone":
        phoneInvalid.value = true;
        step.value = "phone";

        return;
      case "unavailable":
        reportError(AUTH_MESSAGES.sendUnavailable);

        return;
      case "uncertain":
        reportError(AUTH_MESSAGES.sendUncertain);

        return;
      case "cancelled":
        return;
      default:
        outcome satisfies never;

        return;
    }
  }

  async function confirmCode() {
    if (!canConfirm.value) {
      return;
    }

    reportError("");
    pending.value = true;

    const outcome = await session.establish(requestedPhone.value, code.value);

    if (disposed) {
      return;
    }

    pending.value = false;

    switch (outcome.kind) {
      case "staff":
        confirmationBlocked.value = true;
        authenticated();

        return;
      case "denied":
        code.value = "";
        step.value = "denied";

        return;
      case "invalid-code":
        step.value = "invalid-code";

        return;
      case "expired-code":
        code.value = "";
        step.value = "expired";

        return;
      case "unavailable":
        reportError(AUTH_MESSAGES.verifyUnavailable);

        return;
      case "uncertain":
        confirmationBlocked.value = true;
        reportError(AUTH_MESSAGES.verifyUncertain);

        return;
      case "anonymous":
        resetEntry();
        reportError(AUTH_MESSAGES.sessionLost);

        return;
      case "cancelled":
        return;
      default:
        outcome satisfies never;

        return;
    }
  }

  function resetEntry() {
    step.value = "phone";
    code.value = "";
    requestedPhone.value = "";
    phoneInvalid.value = false;
    confirmationBlocked.value = false;
  }

  async function changeNumber() {
    if (pending.value) {
      return;
    }

    if (session.state.kind !== "anonymous") {
      pending.value = true;
      const ended = await session.logout();

      if (disposed) {
        return;
      }

      pending.value = false;

      // Смена номера допустима только после подтверждённого logout204.
      if (!ended) {
        reportError(AUTH_MESSAGES.logoutFailure);

        return;
      }
    }

    reportError("");
    resetEntry();
  }

  watch(
    () => session.state.kind,
    (current, previous) => {
      if (current === "staff") {
        hadStaffSession = true;
      } else if (current === "denied") {
        step.value = "denied";
        code.value = "";
      } else if (current === "anonymous" && hadStaffSession) {
        hadStaffSession = false;
        phone.value = "";
        resetEntry();
        reportError(previous === "staff" ? AUTH_MESSAGES.sessionLost : "");
      }
    },
    { immediate: true, flush: "sync" },
  );

  onScopeDispose(() => {
    disposed = true;
    activeOtpRequest?.abort();
    clearTimeout(cooldownTimer);
    session.invalidate();
  });

  return {
    step: readonly(step),
    phone: readonly(phone),
    shownPhone,
    code: readonly(code),
    phoneInvalid: readonly(phoneInvalid),
    pending: readonly(pending),
    canSend,
    canConfirm,
    setPhone,
    setCode,
    rejectPhone,
    sendCode,
    confirmCode,
    changeNumber,
  };
}
