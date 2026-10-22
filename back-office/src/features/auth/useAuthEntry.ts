import { computed, onScopeDispose, readonly, shallowRef, watch } from "vue";
import { useSessionStore } from "../../entities/session/session.store";
import { requestOtp } from "./auth.api";
import {
  AUTH_MESSAGES,
  COOLDOWN_SECOND_MS,
  OTP_PATTERN,
} from "./auth.constants";
import type { AuthStep } from "./auth.types";
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
  let cooldownDeadline = 0;
  let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
  let activeRequest: AbortController | null = null;
  let disposed = false;
  // Pending logout не завершает подтверждённый контекст до ответа сервера.
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
    cooldownDeadline = Math.max(
      cooldownDeadline,
      Date.now() + seconds * COOLDOWN_SECOND_MS,
    );
    coolingDown.value = cooldownDeadline > Date.now();
    cooldownTimer = setTimeout(
      () => {
        coolingDown.value = false;
      },
      Math.max(0, cooldownDeadline - Date.now()),
    );
  }

  async function sendCode() {
    const target =
      step.value === "expired" ? requestedPhone.value : normalizedPhone.value;

    if (target === null || target === "") {
      rejectPhone();

      return;
    }

    if (pending.value || coolingDown.value) {
      return;
    }

    const controller = new AbortController();

    reportError("");
    activeRequest = controller;
    pending.value = true;
    const outcome = await requestOtp(target, controller.signal);

    if (disposed || activeRequest !== controller) {
      return;
    }

    activeRequest = null;
    pending.value = false;

    if (outcome.kind === "sent") {
      requestedPhone.value = target;
      code.value = "";
      confirmationBlocked.value = false;
      step.value = "otp";
      imposeCooldown(outcome.retryAfterSeconds);
    } else if (outcome.kind === "rate-limited") {
      if (outcome.retryAfterSeconds !== null) {
        imposeCooldown(outcome.retryAfterSeconds);
      }

      reportError(AUTH_MESSAGES.cooldown);
    } else if (outcome.kind === "invalid-phone") {
      phoneInvalid.value = true;
      step.value = "phone";
    } else if (outcome.kind === "unavailable") {
      reportError(AUTH_MESSAGES.sendUnavailable);
    } else if (outcome.kind === "uncertain") {
      reportError(AUTH_MESSAGES.sendUncertain);
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

    if (outcome.kind === "staff") {
      confirmationBlocked.value = true;
      authenticated();
    } else if (outcome.kind === "denied") {
      code.value = "";
      step.value = "denied";
    } else if (outcome.kind === "invalid-code") {
      step.value = "invalid-code";
    } else if (outcome.kind === "expired-code") {
      code.value = "";
      step.value = "expired";
    } else if (outcome.kind === "unavailable") {
      reportError(AUTH_MESSAGES.verifyUnavailable);
    } else if (outcome.kind === "uncertain") {
      confirmationBlocked.value = true;
      reportError(AUTH_MESSAGES.verifyUncertain);
    } else if (outcome.kind === "anonymous") {
      resetEntry();
      reportError(AUTH_MESSAGES.sessionLost);
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
    activeRequest?.abort();
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
