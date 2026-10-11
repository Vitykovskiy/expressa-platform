import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useSessionStore } from "../../entities/session/session.store";
import { ApiFailure } from "../../shared/api/transport";
import { otpPattern } from "./otp.constants";

export const useOtpStore = defineStore("otp", () => {
  const session = useSessionStore();
  const phone = ref("");
  const code = ref("");
  const requestedPhone = ref<string | null>(null);
  const phoneError = ref("");
  const codeError = ref("");
  const formError = ref("");
  const expiresAt = ref<number | null>(null);
  const retryAt = ref<number | null>(null);
  const verifyRetryAt = ref<number | null>(null);
  const now = ref(Date.now());
  const cooldown = computed(() =>
    retryAt.value === null
      ? 0
      : Math.max(0, Math.ceil((retryAt.value - now.value) / 1000)),
  );
  const verifyCooldown = computed(() =>
    verifyRetryAt.value === null
      ? 0
      : Math.max(0, Math.ceil((verifyRetryAt.value - now.value) / 1000)),
  );
  const expired = computed(
    () => expiresAt.value !== null && now.value >= expiresAt.value,
  );

  function tick() {
    now.value = Date.now();
  }

  function updatePhone(value: string) {
    if (!session.busy) {
      phone.value = value;
      phoneError.value = "";
    }
  }

  function updateCode(value: string) {
    if (!session.busy) {
      code.value = value;
      codeError.value = "";
    }
  }

  function changePhone() {
    if (session.busy) {
      return;
    }

    requestedPhone.value = null;
    code.value = "";
    codeError.value = "";
    formError.value = "";
    expiresAt.value = null;
  }

  async function send() {
    tick();

    if (session.busy || cooldown.value > 0) {
      return false;
    }

    const target = requestedPhone.value ?? phone.value.trim();

    if (target === "") {
      phoneError.value = "Введите телефон";

      return false;
    }

    formError.value = "";
    phoneError.value = "";
    codeError.value = "";

    try {
      const metadata = await session.requestCode(target);

      requestedPhone.value = target;
      expiresAt.value = Date.now() + metadata.expiresInSeconds * 1000;
      retryAt.value = Date.now() + metadata.retryAfterSeconds * 1000;
      code.value = "";
      tick();

      return true;
    } catch (error) {
      if (error instanceof ApiFailure && error.kind === "aborted") {
        return false;
      }

      if (
        error instanceof ApiFailure &&
        error.response?.code === "VALIDATION_ERROR"
      ) {
        phoneError.value = "Введите корректный российский номер телефона";
      } else if (
        error instanceof ApiFailure &&
        error.response?.code === "AUTH_RATE_LIMITED"
      ) {
        if (error.retryAfterSeconds !== null) {
          retryAt.value = Date.now() + error.retryAfterSeconds * 1000;
          tick();
        }

        formError.value = "Слишком много запросов. Повторите позже.";
      } else if (
        error instanceof ApiFailure &&
        error.kind === "http" &&
        error.status !== null &&
        (error.status < 500 || error.status === 503)
      ) {
        formError.value = "Не удалось отправить код. Повторите попытку.";
      } else {
        requestedPhone.value = target;
        expiresAt.value = null;
        formError.value =
          "Не удалось подтвердить отправку кода. Если код пришёл, введите его.";
      }

      return requestedPhone.value !== null;
    }
  }

  async function verify() {
    tick();

    if (
      session.busy ||
      requestedPhone.value === null ||
      verifyCooldown.value > 0
    ) {
      return;
    }

    if (expired.value) {
      codeError.value = "Код истёк. Запросите новый.";

      return;
    }

    if (!otpPattern.test(code.value)) {
      codeError.value = "Введите 6 цифр";

      return;
    }

    codeError.value = "";
    formError.value = "";

    try {
      await session.signIn(requestedPhone.value, code.value);
    } catch (error) {
      if (
        error instanceof ApiFailure &&
        error.response?.code === "AUTH_RATE_LIMITED"
      ) {
        if (error.retryAfterSeconds !== null) {
          verifyRetryAt.value = Date.now() + error.retryAfterSeconds * 1000;
          tick();
        }

        codeError.value = "Слишком много попыток. Повторите позже.";
      } else if (
        error instanceof ApiFailure &&
        error.response?.code === "AUTH_CODE_INVALID"
      ) {
        codeError.value = "Неверный код";
      } else if (
        error instanceof ApiFailure &&
        error.response?.code === "AUTH_CODE_EXPIRED"
      ) {
        codeError.value = "Код истёк. Запросите новый.";
      } else if (
        error instanceof ApiFailure &&
        error.response?.code === "VALIDATION_ERROR"
      ) {
        codeError.value = "Проверьте телефон и код";
      } else {
        formError.value =
          "Не удалось подтвердить вход. Проверьте сеанс или повторите попытку.";
      }
    }
  }

  function clear() {
    phone.value = "";
    code.value = "";
    requestedPhone.value = null;
    phoneError.value = "";
    codeError.value = "";
    formError.value = "";
    expiresAt.value = null;
    retryAt.value = null;
    verifyRetryAt.value = null;
  }

  return {
    phoneDraft: computed(() => phone.value),
    codeDraft: computed(() => code.value),
    requestedPhone: computed(() => requestedPhone.value),
    phoneError: computed(() => phoneError.value),
    codeError: computed(
      () =>
        codeError.value || (expired.value ? "Код истёк. Запросите новый." : ""),
    ),
    error: computed(() => formError.value),
    cooldown,
    verifyCooldown,
    updatePhone,
    updateCode,
    changePhone,
    send,
    verify,
    tick,
    clear,
  };
});
