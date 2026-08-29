import { expect, test } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";
import type { E2eOtpCredentials } from "@support/config/e2e-environment.types";

export class BackOfficeAuthFormComponent {
  private readonly phoneInput: Locator;
  private readonly otpInput: Locator;
  private readonly sendOtpButton: Locator;
  private readonly confirmOtpButton: Locator;
  private readonly signOutButton: Locator;
  private readonly deniedMessage: Locator;

  constructor(page: Page) {
    this.phoneInput = page.locator("#auth-phone");
    this.otpInput = page.locator("#auth-otp");
    this.sendOtpButton = page.getByRole("button", {
      name: "Отправить код",
      exact: true,
    });
    this.confirmOtpButton = page.getByRole("button", {
      name: "Подтвердить",
      exact: true,
    });
    this.signOutButton = page.getByRole("button", {
      name: "Выйти",
      exact: true,
    });
    this.deniedMessage = page.getByRole("alert");
  }

  async signIn(credentials: E2eOtpCredentials): Promise<void> {
    await test.step("Войти в back-office", async () => {
      await this.fillPhone(credentials.phone);
      await this.requestCode();
      await this.fillCode(credentials.otp);
      await this.confirmCode();
      await expect(
        this.signOutButton,
        "Пользователь вошёл в back-office.",
      ).toBeVisible();
    });
  }

  async signOut(): Promise<void> {
    await test.step("Выйти из back-office", async () => {
      await expect(this.signOutButton, "Кнопка выхода доступна.").toBeEnabled();
      await this.signOutButton.click();
      await expect(
        this.phoneInput,
        "Сессия back-office завершена.",
      ).toBeVisible();
    });
  }

  async fillPhone(phone: string): Promise<void> {
    await test.step("Указать номер сотрудника", async () => {
      await expect(this.phoneInput, "Поле телефона доступно.").toBeEnabled();
      await this.phoneInput.fill(phone);
      await expect(
        this.phoneInput,
        "В поле указан номер сотрудника.",
      ).toHaveValue(formatPhoneForUi(phone));
    });
  }

  async requestCode(): Promise<void> {
    await test.step("Запросить одноразовый код сотрудника", async () => {
      await expect(
        this.sendOtpButton,
        "Кнопка отправки кода доступна.",
      ).toBeEnabled();
      await this.sendOtpButton.click();
      await expect(
        this.otpInput,
        "Появилось поле кода подтверждения.",
      ).toBeVisible();
    });
  }

  async fillCode(otp: string): Promise<void> {
    await test.step("Указать одноразовый код сотрудника", async () => {
      await expect(this.otpInput, "Поле кода доступно.").toBeEnabled();
      await this.otpInput.fill(otp);
      await expect(
        this.otpInput,
        "В поле указан код подтверждения.",
      ).toHaveValue(otp);
    });
  }

  async confirmCode(): Promise<void> {
    await test.step("Подтвердить одноразовый код сотрудника", async () => {
      await expect(
        this.confirmOtpButton,
        "Кнопка подтверждения кода доступна.",
      ).toBeEnabled();
      await this.confirmOtpButton.click();
      await expect(
        this.signOutButton.or(this.deniedMessage),
        "Подтверждение кода завершено.",
      ).toBeVisible();
    });
  }

  async isAccessDeniedVisible(): Promise<boolean> {
    return this.deniedMessage.isVisible();
  }

  async waitReady(): Promise<void> {
    await expect(
      this.phoneInput,
      "Форма входа в back-office показана.",
    ).toBeVisible();
  }
}

function formatPhoneForUi(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}
