import { expect, test, type Locator, type Page } from "@playwright/test";

import { AvailabilityListComponent } from "./availability-list/availability-list.component";

export class AvailabilityManagementPage {
  public readonly list: AvailabilityListComponent;

  private readonly availabilityButton: Locator;

  constructor(page: Page) {
    this.list = new AvailabilityListComponent(page);
    this.availabilityButton = page.getByRole("button", {
      name: "Доступность",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await test.step("Открыть управление доступностью", async () => {
      await expect(
        this.availabilityButton,
        "Раздел «Доступность» доступен.",
      ).toBeEnabled();
      await this.availabilityButton.click();
      await this.list.waitReady();
    });
  }
}
