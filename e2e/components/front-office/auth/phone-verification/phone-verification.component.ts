import { expect, test, type Page } from "@playwright/test";

import type { E2eOtpCredentials } from "@support/config/e2e-environment.types";

export class PhoneVerificationComponent {
  private readonly phoneInput;
  private readonly sendCodeButton;
  private readonly otpInput;
  private readonly confirmButton;

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
  }

  async verify(credentials: E2eOtpCredentials): Promise<void> {
    await test.step("Подтвердить номер телефона", async () => {
      await expect(
        this.phoneInput,
        "Поле номера телефона доступно.",
      ).toBeEnabled();
      await this.phoneInput.fill(credentials.phone);
      await expect(
        this.sendCodeButton,
        "Кнопка отправки кода доступна.",
      ).toBeEnabled();
      await this.sendCodeButton.click();
      await expect(
        this.otpInput,
        "Поле одноразового кода показано.",
      ).toBeVisible();
      await this.otpInput.fill(credentials.otp);
      await expect(
        this.confirmButton,
        "Кнопка подтверждения кода доступна.",
      ).toBeEnabled();
      await this.confirmButton.click();
      await expect(
        this.otpInput,
        "Подтверждение номера завершено.",
      ).toHaveCount(0);
    });
  }
}
