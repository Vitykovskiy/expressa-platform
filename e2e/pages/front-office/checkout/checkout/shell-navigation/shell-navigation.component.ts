import { expect, test } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";

export class ShellNavigationComponent {
  private readonly menuButton: Locator;

  constructor(private readonly page: Page) {
    this.menuButton = page.getByRole("button", {
      name: "Меню",
      exact: true,
    });
  }

  async openMenu(): Promise<void> {
    await test.step("Открыть меню через основную навигацию", async () => {
      await expect(this.menuButton, "Переход в меню доступен.").toBeEnabled();
      await this.menuButton.click();
      await expect(this.page, "Открыт путь публичного меню.").toHaveURL(
        (url) => url.pathname === "/",
      );
    });
  }

  async isCartEmpty(): Promise<boolean> {
    const cartControls = this.page.getByRole("button", {
      name: /^Корзина/u,
    });

    await expect(
      cartControls,
      "Показан элемент основной навигации «Корзина».",
    ).not.toHaveCount(0);
    const labels = await cartControls.allInnerTexts();

    return labels.every((label) => !this.hasCartCount(label));
  }

  private hasCartCount(label: string): boolean {
    return /\d/u.test(label);
  }
}
