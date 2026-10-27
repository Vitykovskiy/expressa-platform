<template>
  <section
    class="auth-card"
    :aria-labelledby="isDenied ? 'denied-title' : 'auth-title'"
  >
    <template v-if="isDenied">
      <div class="denied-icon"><img :src="deniedIcon" alt="" /></div>
      <h1 id="denied-title" class="denied-title">Нет доступа</h1>
      <p class="denied-copy">
        Попросите администратора проверить доступ для этого номера или войдите с
        другим номером.
      </p>
      <button
        class="auth-button ghost denied-action"
        type="button"
        @click="emit('changeNumberRequested')"
      >
        <img :src="arrowIcon" alt="" />Изменить номер
      </button>
    </template>
    <template v-else>
      <p class="brand">Expressa Admin</p>
      <h1 id="auth-title" class="title">
        {{ isPhone ? "Вход для сотрудников" : "Подтверждение входа" }}
      </h1>
      <form class="entry-form" novalidate @submit.prevent="submitEntry">
        <template v-if="isPhone">
          <label class="field-label" for="auth-phone">Телефон</label>
          <div class="phone-field">
            <input
              id="auth-phone"
              class="auth-input phone-input"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="+7 900 000-00-00"
              :value="phone"
              :aria-invalid="phoneInvalid"
              :aria-describedby="phoneInvalid ? 'phone-error' : 'phone-help'"
              @input="emitPhoneChange"
              @beforeinput="handlePhoneDeletion"
              @keydown.enter.prevent="submitEntry"
            />
            <img class="phone-icon" :src="phoneIcon" alt="" />
          </div>
          <p
            v-if="phoneInvalid"
            id="phone-error"
            class="inline-error phone-error"
            role="alert"
          >
            <img :src="errorIcon" alt="" /><span
              >Введите корректный номер телефона</span
            >
          </p>
          <button
            class="auth-button primary"
            type="submit"
            :disabled="!canSend"
          >
            Отправить код
          </button>
          <p id="phone-help" class="phone-help">
            Используйте номер, зарегистрированный<br />администратором
          </p>
        </template>
        <template v-else>
          <p class="sent-copy">Сообщение отправлено на {{ phone }}</p>
          <div v-if="!isExpired" class="otp-field">
            <label class="field-label" for="auth-code">Код из сообщения</label>
            <input
              id="auth-code"
              ref="codeInput"
              class="auth-input otp-input"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="• • • •"
              :value="code"
              :aria-invalid="isInvalidCode"
              :aria-describedby="isInvalidCode ? 'code-error' : undefined"
              @input="emitCodeChange"
            />
          </div>
          <p
            v-if="showCodeError"
            id="code-error"
            class="inline-error code-error"
            role="alert"
          >
            <img :src="errorIcon" alt="" /><span>{{ codeErrorMessage }}</span>
          </p>
          <button
            class="auth-button primary"
            type="submit"
            :disabled="codeActionDisabled"
          >
            {{ codeActionLabel }}
          </button>
          <button
            class="auth-button ghost change-number"
            type="button"
            @click="emit('changeNumberRequested')"
          >
            <img :src="arrowIcon" alt="" />Изменить номер
          </button>
        </template>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef } from "vue";
import { maskPhoneInput } from "../phone";
import arrowIcon from "./assets/arrow-left.svg";
import deniedIcon from "./assets/denied.svg";
import errorIcon from "./assets/error.svg";
import phoneIcon from "./assets/phone.svg";
import type { AuthCardEmits, AuthCardProps } from "./AuthCard.types";

const props = defineProps<AuthCardProps>();
const emit = defineEmits<AuthCardEmits>();
const codeInput = useTemplateRef<globalThis.HTMLInputElement>("codeInput");

const isPhone = computed(() => props.step === "phone");
const isDenied = computed(() => props.step === "denied");
const isExpired = computed(() => props.step === "expired");
const isInvalidCode = computed(() => props.step === "invalid-code");

const showCodeError = computed(() => isExpired.value || isInvalidCode.value);
const codeErrorMessage = computed(() =>
  isExpired.value
    ? "Срок действия кода истёк."
    : "Неверный код. Проверьте цифры в сообщении.",
);

const codeActionLabel = computed(() =>
  isExpired.value ? "Получить новый код" : "Подтвердить",
);
const codeActionDisabled = computed(() =>
  isExpired.value ? !props.canSend : !props.canConfirm,
);

async function emitPhoneChange(event: globalThis.Event) {
  if (!(event.target instanceof globalThis.HTMLInputElement)) {
    return;
  }

  await updatePhoneInput(event.target);
}

async function updatePhoneInput(input: globalThis.HTMLInputElement) {
  const masked = maskPhoneInput(
    input.value,
    input.selectionStart ?? input.value.length,
  );

  input.value = masked.phone;
  emit("phoneChanged", masked.phone);
  await nextTick();

  if (
    input === globalThis.document.activeElement &&
    input.value === masked.phone
  ) {
    input.setSelectionRange(masked.caret, masked.caret);
  }
}

async function handlePhoneDeletion(event: globalThis.InputEvent) {
  if (!(event.target instanceof globalThis.HTMLInputElement)) {
    return;
  }

  const input = event.target;
  const caret = input.selectionStart;
  const backward = event.inputType === "deleteContentBackward";
  const forward = event.inputType === "deleteContentForward";

  if (
    (!backward && !forward) ||
    caret === null ||
    caret !== input.selectionEnd
  ) {
    return;
  }

  if (forward && caret < 3) {
    event.preventDefault();

    return;
  }

  if (backward && caret <= 3) {
    event.preventDefault();

    if (input.value === "+7") {
      input.value = "";
      await updatePhoneInput(input);
    }

    return;
  }

  let index = backward ? caret - 1 : Math.max(3, caret);

  if (/\d/.test(input.value[index] ?? "")) {
    return;
  }

  // Разделитель маски удаляется вместе с соседней цифрой, а не появляется снова.
  while (index >= 3 && index < input.value.length) {
    if (/\d/.test(input.value[index] ?? "")) {
      event.preventDefault();
      input.setRangeText("", index, index + 1, "start");
      await updatePhoneInput(input);

      return;
    }

    index += backward ? -1 : 1;
  }
}

function emitCodeChange(event: globalThis.Event) {
  if (!(event.target instanceof globalThis.HTMLInputElement)) {
    return;
  }

  emit("codeChanged", event.target.value);
}

function submitEntry() {
  if (isPhone.value) {
    if (props.canSend) {
      emit("sendRequested");
    } else {
      emit("invalidPhoneSubmitted");
    }

    return;
  }

  if (isExpired.value) {
    emit("sendRequested");

    return;
  }

  emit("confirmRequested");
}

onMounted(async () => {
  await nextTick();
  codeInput.value?.focus();
});
</script>

<style scoped>
/* Геометрия AuthCard и Field из макета; общая палитра и радиусы принадлежат app. */
.auth-card {
  --auth-card-width: 360px;
  --auth-padding: 32px;
  --auth-field-gap: 6px;
  --auth-action-gap: 16px;
  --auth-focus: #a4a4e9;
  width: min(var(--auth-card-width), 100%);
  padding: var(--auth-padding);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  box-shadow:
    0 1px 2px -1px rgb(0 0 0 / 10%),
    0 1px 3px rgb(0 0 0 / 10%);
}
.brand {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.title {
  margin: 4px 0 0;
  color: var(--color-foreground);
  font-size: 22px;
  font-weight: 700;
  line-height: 33px;
  letter-spacing: -0.2578px;
}
.entry-form {
  padding-top: 24px;
}
.field-label {
  display: block;
  color: var(--color-foreground-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
  letter-spacing: -0.0762px;
}
.phone-field {
  position: relative;
  padding-top: var(--auth-field-gap);
}
.auth-input {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  color: var(--color-foreground);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  outline: none;
}
.auth-input:focus-visible {
  border-color: var(--auth-focus);
}
.auth-input::placeholder {
  color: var(--color-foreground-muted);
  opacity: 1;
}
.phone-input {
  height: 43px;
  padding-left: 36px;
  font-size: 14px;
  letter-spacing: -0.1504px;
}
.phone-icon {
  position: absolute;
  left: 12px;
  top: 20px;
}
.auth-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 45px;
  padding: 12px 0;
  border: 0;
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
  letter-spacing: -0.1504px;
  cursor: pointer;
}
.primary {
  margin-top: var(--auth-action-gap);
  color: var(--color-on-primary);
  background: var(--color-primary);
}
.primary:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
.ghost {
  color: var(--color-foreground-muted);
  background: transparent;
}
.change-number {
  margin-top: 4px;
}
.phone-help {
  padding-top: 20px;
  margin: 0;
  color: #5c5c63;
  font-size: 12px;
  line-height: 17.875px;
  letter-spacing: 0.0645px;
  text-align: center;
}
.sent-copy {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  letter-spacing: -0.0762px;
  overflow-wrap: anywhere;
}
.otp-field {
  padding-top: 20px;
}
.otp-input {
  height: 49px;
  margin-top: var(--auth-field-gap);
  font-size: 18px;
  line-height: 27px;
  text-align: center;
  letter-spacing: 6.7605px;
}
.otp-input::placeholder {
  letter-spacing: 6.7605px;
}
.inline-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  color: var(--color-danger);
  font-size: 12px;
  line-height: 18px;
}
.inline-error img {
  flex-shrink: 0;
  margin-top: 2px;
}
.code-error {
  height: 38px;
}
.otp-field + .code-error {
  padding-top: 8px;
}
.denied-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto;
  background: #ffebee;
  border-radius: 50%;
}
.denied-title {
  margin: 16px 0 0;
  color: var(--color-foreground);
  font-size: 17px;
  font-weight: 600;
  line-height: 25.5px;
  letter-spacing: -0.4316px;
  text-align: center;
}
.denied-copy {
  min-height: 60px;
  margin: 8px 0 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 21.125px;
  letter-spacing: -0.0762px;
  text-align: center;
}
.denied-action {
  margin-top: 16px;
}
@media (max-width: 359px) {
  /* Для этой ширины нет макета; подсказка переносится без принудительного разрыва. */
  .phone-help br {
    display: none;
  }
}
</style>
