import { expect, test, type Page } from "@playwright/test";

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

  async fillPhone(phone: string): Promise<void> {
    await test.step("Указать номер телефона", async () => {
      await expect(
        this.phoneInput,
        "Поле номера телефона доступно.",
      ).toBeEnabled();
      await this.phoneInput.fill(phone);
      await expect(this.phoneInput, "Номер телефона указан.").toHaveValue(
        phone,
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
        this.otpInput,
        "Подтверждение номера завершено.",
      ).toHaveCount(0);
    });
  }
}
