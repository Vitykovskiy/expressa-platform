import type { Page } from "@playwright/test";

import { OrderDetailsComponent } from "./order-details/order-details.component";

export class CustomerOrderPage {
  public readonly details: OrderDetailsComponent;

  constructor(page: Page) {
    this.details = new OrderDetailsComponent(page);
  }
}
