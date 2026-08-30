import { expect, test } from "@playwright/test";

import { PhoneVerificationComponent } from "@components/front-office/auth/phone-verification/phone-verification.component";
import { PhoneVerificationStep } from "@components/front-office/auth/phone-verification/phone-verification.component.types";
import { GuestCheckoutFormComponent } from "@components/front-office/checkout/guest-checkout-form/guest-checkout-form.component";

import { CustomerSessionState } from "./customer-auth.page.types";

import type { Locator, Page } from "@playwright/test";

export class CustomerAuthPage {
  public readonly phoneVerification: PhoneVerificationComponent;
  public readonly profile: GuestCheckoutFormComponent;
  private readonly signOutButton: Locator;
  private readonly signInButton: Locator;
  private readonly publicInterface: Locator;

  constructor(private readonly page: Page) {
    this.phoneVerification = new PhoneVerificationComponent(page);
    this.profile = new GuestCheckoutFormComponent(page);
    this.signOutButton = page.getByRole("button", {
      name: /Выйти$/u,
    });
    this.signInButton = page.getByRole("button", {
      name: "Подтвердить телефон",
      exact: true,
    });
    this.publicInterface = page.getByRole("main");
  }

  async open(frontUrl: string): Promise<void> {
    await test.step("Открыть вход клиента", async () => {
      await this.page.goto(new URL("/", frontUrl).toString());
      await expect(
        this.signInButton,
        "Кнопка подтверждения телефона доступна гостю.",
      ).toBeVisible();
      await this.signInButton.click();
      await expect(this.page, "Открыт ввод номера телефона.").toHaveURL(
        (url) => url.pathname === "/auth/phone",
      );
      await this.phoneVerification.assertStep(PhoneVerificationStep.PHONE);
    });
  }

  async reload(): Promise<void> {
    await test.step("Перезагрузить публичный интерфейс", async () => {
      await this.page.reload();
      await expect(
        this.publicInterface,
        "Публичный интерфейс загружен после перезагрузки.",
      ).toBeVisible();
    });
  }

  async signOut(): Promise<void> {
    await test.step("Выйти из учётной записи клиента", async () => {
      await expect(
        this.signOutButton,
        "Кнопка выхода из учётной записи доступна.",
      ).toBeEnabled();
      await this.signOutButton.click();
      await this.assertSession(CustomerSessionState.GUEST);
    });
  }

  async assertSession(state: CustomerSessionState): Promise<void> {
    if (state === CustomerSessionState.AUTHENTICATED) {
      await expect(
        this.signOutButton,
        "Клиент авторизован в публичном интерфейсе.",
      ).toBeVisible();
      return;
    }

    await expect(
      this.signInButton,
      "Публичный интерфейс открыт для неавторизованного клиента.",
    ).toBeVisible();
  }

  async isAuthenticatedAccountVisible(phone: string): Promise<boolean> {
    return this.authenticatedAccountControl(phone).isVisible();
  }

  async isPublicInterfaceVisible(): Promise<boolean> {
    return this.publicInterface.isVisible();
  }

  private authenticatedAccountControl(phone: string): Locator {
    const normalizedPhone = this.normalizeRussianPhone(phone);
    return this.page.getByRole("button", {
      name: new RegExp(
        `^${this.escapeRegularExpression(normalizedPhone)}(?:: история заказов| Выйти)$`,
        "u",
      ),
    });
  }

  private escapeRegularExpression(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  }

  private normalizeRussianPhone(phone: string): string {
    return `+7${phone.replace(/\D/gu, "").slice(1)}`;
  }
}
