import { type Locator, type Page } from "@playwright/test";

import { PhoneVerificationComponent } from "@components/front-office/auth/phone-verification/phone-verification.component";
import { GuestCheckoutFormComponent } from "@components/front-office/checkout/guest-checkout-form/guest-checkout-form.component";

import { CartPanelComponent } from "./cart-panel/cart-panel.component";
import { ShellNavigationComponent } from "./shell-navigation/shell-navigation.component";

export class CheckoutPage {
  public readonly cart: CartPanelComponent;
  public readonly navigation: ShellNavigationComponent;
  public readonly phoneVerification: PhoneVerificationComponent;
  public readonly profile: GuestCheckoutFormComponent;
  private readonly cartHeading: Locator;

  constructor(page: Page) {
    this.cart = new CartPanelComponent(page);
    this.navigation = new ShellNavigationComponent(page);
    this.phoneVerification = new PhoneVerificationComponent(page);
    this.profile = new GuestCheckoutFormComponent(page);
    this.cartHeading = page.getByRole("heading", {
      name: "Корзина",
      exact: true,
    });
  }

  async isCartOpen(): Promise<boolean> {
    return this.cartHeading.isVisible();
  }
}
