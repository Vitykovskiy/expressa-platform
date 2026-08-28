import { expect, test, type Locator, type Page } from "@playwright/test";

import { PhoneVerificationComponent } from "@components/front-office/auth/phone-verification/phone-verification.component";
import { GuestCheckoutFormComponent } from "@components/front-office/checkout/guest-checkout-form/guest-checkout-form.component";

import { CustomerSessionState } from "./customer-auth.page.types";

export class CustomerAuthPage {
  public readonly phoneVerification: PhoneVerificationComponent;
  public readonly profile: GuestCheckoutFormComponent;

  constructor(private readonly page: Page) {
    this.phoneVerification = new PhoneVerificationComponent(page);
    this.profile = new GuestCheckoutFormComponent(page);
  }

  async open(url: string): Promise<void> {
    await test.step("Открыть вход клиента", async () => {
      await this.page.goto(`${url}/auth/phone`);
      await expect(
        this.page.getByLabel("Номер телефона", { exact: true }),
        "Открыта форма входа клиента.",
      ).toBeVisible();
    });
  }

  async reload(): Promise<void> {
    await test.step("Перезагрузить публичный интерфейс", async () => {
      await this.page.reload();
      await expect(
        this.page.getByRole("main"),
        "Публичный интерфейс загружен после перезагрузки.",
      ).toBeVisible();
    });
  }

  async signOut(): Promise<void> {
    await test.step("Выйти из учётной записи customer", async () => {
      await expect(
        this.accountButton,
        "Кнопка выхода customer доступна.",
      ).toBeEnabled();
      await this.accountButton.click();
      await this.assertSession(CustomerSessionState.GUEST);
    });
  }

  async assertSession(state: CustomerSessionState): Promise<void> {
    if (state === CustomerSessionState.AUTHENTICATED) {
      await expect(
        this.accountButton,
        "Customer авторизован в публичном интерфейсе.",
      ).toBeVisible();
      return;
    }

    await expect(
      this.signInButton,
      "Публичный интерфейс открыт для гостя.",
    ).toBeVisible();
  }

  async isAuthenticatedAccountVisible(phone: string): Promise<boolean> {
    return this.page
      .getByRole("button", {
        name: new RegExp(
          `${this.escapeRegularExpression(this.normalizeRussianPhone(phone))}.*Выйти`,
        ),
      })
      .isVisible();
  }

  async isPublicInterfaceVisible(): Promise<boolean> {
    return this.page.getByRole("main").isVisible();
  }

  private get accountButton(): Locator {
    return this.page.getByRole("button", { name: /Выйти/ });
  }

  private get signInButton(): Locator {
    return this.page.getByRole("button", {
      name: "Подтвердить телефон",
      exact: true,
    });
  }

  private escapeRegularExpression(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  }

  private normalizeRussianPhone(phone: string): string {
    return `+7${phone.replace(/\D/gu, "").slice(1)}`;
  }
}
