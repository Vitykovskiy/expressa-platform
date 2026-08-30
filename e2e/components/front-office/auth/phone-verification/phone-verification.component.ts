import { expect, test } from "@playwright/test";

import {
  PhoneVerificationError,
  PhoneVerificationStep,
} from "./phone-verification.component.types";

import type { Locator, Page } from "@playwright/test";

export class PhoneVerificationComponent {
  private readonly phoneInput: Locator;
  private readonly sendCodeButton: Locator;
  private readonly otpInput: Locator;
  private readonly confirmButton: Locator;
  private readonly resendCodeButton: Locator;
  private readonly errorMessage: Locator;
  private readonly authenticatedAccountButton: Locator;

  constructor(page: Page) {
    this.phoneInput = page.getByLabel("Номер телефона", { exact: true });
    this.sendCodeButton = page.getByRole("button", {
      name: "Отправить код",
      exact: true,
    });
    this.otpInput = page.getByLabel("Код из сообщения", { exact: true });
    this.confirmButton = page.getByRole("button", {
      name: "Подтвердить",
      exact: true,
    });
    this.resendCodeButton = page.getByRole("button", {
      name: /Отправить код (ещё раз|повторно)/,
    });
    this.errorMessage = page.getByRole("alert");
    this.authenticatedAccountButton = page.getByRole("button", {
      name: /Выйти$/u,
    });
  }

  async fillPhone(phone: string): Promise<void> {
    await test.step("Указать номер телефона", async () => {
      await expect(
        this.phoneInput,
        "Поле номера телефона доступно.",
      ).toBeEnabled();
      await this.phoneInput.fill(phone);
      await expect(this.phoneInput, "Номер телефона указан.").toHaveValue(
        formatPhoneForUi(phone),
      );
    });
  }

  async requestCode(): Promise<void> {
    await test.step("Запросить одноразовый код", async () => {
      await expect(
        this.sendCodeButton,
        "Кнопка отправки кода доступна.",
      ).toBeEnabled();
      await this.sendCodeButton.click();
      await expect(
        this.otpInput,
        "Поле одноразового кода показано.",
      ).toBeVisible();
    });
  }

  async fillCode(otp: string): Promise<void> {
    await test.step("Указать одноразовый код", async () => {
      await this.otpInput.fill(otp);
      await expect(this.otpInput, "Одноразовый код указан.").toHaveValue(otp);
    });
  }

  async confirm(): Promise<void> {
    await test.step("Подтвердить номер телефона", async () => {
      await expect(
        this.confirmButton,
        "Кнопка подтверждения кода доступна.",
      ).toBeEnabled();
      await this.confirmButton.click();
      await expect(
        this.authenticatedAccountButton,
        "После подтверждения номера клиент авторизован.",
      ).toBeVisible();
    });
  }

  async confirmInvalidCode(): Promise<void> {
    await test.step("Подтвердить неверный одноразовый код", async () => {
      await expect(
        this.confirmButton,
        "Кнопка подтверждения кода доступна.",
      ).toBeEnabled();
      await this.confirmButton.click();
      await this.assertError(PhoneVerificationError.INVALID_CODE);
      await expect(
        this.otpInput,
        "Клиент остаётся на шаге ввода кода.",
      ).toBeVisible();
      await expect(
        this.authenticatedAccountButton,
        "Клиент не авторизован после неверного кода.",
      ).toBeHidden();
    });
  }

  async resendCode(): Promise<void> {
    await test.step("Повторно запросить одноразовый код", async () => {
      await expect(
        this.resendCodeButton,
        "Кнопка повторной отправки кода доступна.",
      ).toBeEnabled();
      await this.resendCodeButton.click();
      await expect(
        this.otpInput,
        "Клиент остаётся на шаге ввода кода.",
      ).toBeVisible();
    });
  }

  async assertStep(step: PhoneVerificationStep): Promise<void> {
    if (step === PhoneVerificationStep.PHONE) {
      await expect(
        this.phoneInput,
        "Клиент находится на шаге ввода номера.",
      ).toBeVisible();
      return;
    }

    await expect(
      this.otpInput,
      "Клиент находится на шаге ввода кода.",
    ).toBeVisible();
  }

  async assertCodeRequestDisabled(): Promise<void> {
    await expect(
      this.sendCodeButton,
      "Кнопка запроса одноразового кода недоступна.",
    ).toBeDisabled();
  }

  async isCodeConfirmationDisabled(): Promise<boolean> {
    return this.confirmButton.isDisabled();
  }

  async assertError(error: PhoneVerificationError): Promise<void> {
    if (error === PhoneVerificationError.INVALID_CODE) {
      await expect(
        this.errorMessage,
        "Показано сообщение о неверном одноразовом коде.",
      ).toContainText("Одноразовый код недействителен.");
      return;
    }

    if (error === PhoneVerificationError.EXPIRED_CODE) {
      await expect(
        this.errorMessage,
        "Показано сообщение об истечении срока действия кода.",
      ).toContainText("Срок действия одноразового кода истёк.");
      return;
    }

    await expect(
      this.errorMessage,
      "Показано ограничение повторной отправки кода.",
    ).toContainText("Повторный запрос кода пока недоступен.");
  }
}

function formatPhoneForUi(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  const localDigits = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  const number = localDigits.startsWith("7")
    ? localDigits.slice(1)
    : localDigits;

  if (number.length === 0) return "";
  if (number.length <= 3) return `+7 (${number}`;
  if (number.length <= 6)
    return `+7 (${number.slice(0, 3)}) ${number.slice(3)}`;
  if (number.length <= 8) {
    return `+7 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }

  return `+7 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 8)}-${number.slice(8, 10)}`;
}
