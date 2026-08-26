import { expect, test, type Page } from "@playwright/test";

import { PhoneVerificationComponent } from "@components/front-office/auth/phone-verification/phone-verification.component";
import { GuestCheckoutFormComponent } from "@components/front-office/checkout/guest-checkout-form/guest-checkout-form.component";

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
}
