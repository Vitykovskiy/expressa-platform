import type { Page } from "@playwright/test";

import { PhoneVerificationComponent } from "@components/front-office/auth/phone-verification/phone-verification.component";
import { GuestCheckoutFormComponent } from "@components/front-office/checkout/guest-checkout-form/guest-checkout-form.component";

import { CartPanelComponent } from "./cart-panel/cart-panel.component";

export class CheckoutPage {
  public readonly cart: CartPanelComponent;
  public readonly phoneVerification: PhoneVerificationComponent;
  public readonly profile: GuestCheckoutFormComponent;

  constructor(page: Page) {
    this.cart = new CartPanelComponent(page);
    this.phoneVerification = new PhoneVerificationComponent(page);
    this.profile = new GuestCheckoutFormComponent(page);
  }
}
