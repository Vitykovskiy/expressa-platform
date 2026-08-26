import type { Page } from "@playwright/test";

import { OrderQueueComponent } from "./order-queue/order-queue.component";

export class StaffOrdersPage {
  public readonly queue: OrderQueueComponent;

  constructor(page: Page) {
    this.queue = new OrderQueueComponent(page);
  }
}
