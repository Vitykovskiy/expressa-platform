import { expect, test, type Locator, type Page } from "@playwright/test";

import type { E2eOtpCredentials } from "@support/config/e2e-environment.types";

export class BackOfficeAuthFormComponent {
  private readonly phoneInput: Locator;
  private readonly otpInput: Locator;
  private readonly sendOtpButton: Locator;
  private readonly confirmOtpButton: Locator;
  private readonly signOutButton: Locator;

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
  }

  async signIn(credentials: E2eOtpCredentials): Promise<void> {
    await test.step("Войти в back-office", async () => {
      await expect(this.phoneInput, "Поле телефона доступно.").toBeEnabled();
      await this.phoneInput.fill(credentials.phone);
      await expect(
        this.phoneInput,
        "В поле указан номер сотрудника.",
      ).toHaveValue(formatPhoneForUi(credentials.phone));
      await this.sendOtpButton.click();
      await expect(
        this.otpInput,
        "Появилось поле кода подтверждения.",
      ).toBeVisible();
      await this.otpInput.fill(credentials.otp);
      await expect(
        this.otpInput,
        "В поле указан код подтверждения.",
      ).toHaveValue(credentials.otp);
      await this.confirmOtpButton.click();
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
