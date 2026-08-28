import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  type IntakeChangeMetadata,
  AvailabilityState,
} from "./availability-list.types";

export class AvailabilityListComponent {
  private readonly screen: Locator;
  private readonly screenTitle: Locator;
  private readonly searchInput: Locator;
  private readonly intakeToggle: Locator;

  constructor(private readonly page: Page) {
    this.screenTitle = page.getByRole("heading", {
      name: "Доступность",
      exact: true,
      level: 1,
    });
    this.screen = page.getByRole("main").filter({
      has: this.screenTitle,
      hasNot: page.getByRole("main"),
    });
    this.searchInput = this.screen.getByLabel("Поиск по меню", {
      exact: true,
    });
    this.intakeToggle = this.screen.getByRole("switch", {
      name: "Приём новых заказов",
      exact: true,
    });
  }

  async waitReady(): Promise<void> {
    await expect(this.screenTitle, "Экран доступности показан.").toBeVisible();
    await expect(
      this.screen.getByRole("status", { name: "Загружаем доступность" }),
      "Загрузка доступности завершена.",
    ).toHaveCount(0);
  }

  async search(value: string): Promise<void> {
    await test.step(`Найти позицию «${value}»`, async () => {
      await expect(
        this.searchInput,
        "Поиск доступности доступен.",
      ).toBeEnabled();
      await this.searchInput.fill(value);
      await expect(this.searchInput, "Поисковый запрос указан.").toHaveValue(
        value,
      );
    });
  }

  async selectCategory(name: string): Promise<void> {
    await test.step(`Выбрать категорию «${name}»`, async () => {
      const category = this.screen
        .getByRole("group", { name: "Фильтр", exact: true })
        .getByRole("button", { name, exact: true });

      await expect(category, `Категория «${name}» доступна.`).toBeEnabled();
      await category.click();
      await expect(category, `Категория «${name}» выбрана.`).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  }

  async setIntake(state: AvailabilityState): Promise<boolean> {
    return test.step(`Установить приём заказов: ${state}`, async () => {
      return this.setToggle(this.intakeToggle, state, "Приём новых заказов");
    });
  }

  async setProductAvailability(
    name: string,
    state: AvailabilityState,
  ): Promise<void> {
    await this.setItemAvailability(name, state, "товара");
  }

  async setSizeAvailability(
    name: string,
    state: AvailabilityState,
  ): Promise<void> {
    await this.setItemAvailability(name, state, "размера");
  }

  async setModifierAvailability(
    name: string,
    state: AvailabilityState,
  ): Promise<void> {
    await this.setItemAvailability(name, state, "добавки");
  }

  async assertItemVisible(name: string): Promise<void> {
    await expect(
      this.itemToggle(name),
      `Позиция «${name}» показана.`,
    ).toBeVisible();
  }

  async assertCategoryVisible(name: string): Promise<void> {
    await expect(
      this.screen.getByRole("heading", { name, exact: true }),
      `Категория «${name}» показана.`,
    ).toBeVisible();
  }

  async assertItemHidden(name: string): Promise<void> {
    await expect(
      this.itemToggle(name),
      `Позиция «${name}» не показана.`,
    ).toHaveCount(0);
  }

  async assertItemAvailability(
    name: string,
    state: AvailabilityState,
  ): Promise<void> {
    await expect(
      this.itemToggle(name),
      `Доступность позиции «${name}» соответствует состоянию ${state}.`,
    ).toHaveAttribute("aria-checked", state);
  }

  async assertIntakeAvailability(state: AvailabilityState): Promise<void> {
    await expect(
      this.intakeToggle,
      `Приём заказов соответствует состоянию ${state}.`,
    ).toHaveAttribute("aria-checked", state);
  }

  async readIntakeChangeMetadata(): Promise<IntakeChangeMetadata> {
    const metadata = this.intakeChangeMetadata();

    await expect(
      metadata,
      "Метаданные последнего изменения приёма заказов показаны.",
    ).toBeVisible();

    const text = await metadata.textContent();
    const [prefix, actor, ...displayedAt] = text?.split(" ") ?? [];

    if (
      prefix !== "Изменил" ||
      actor === undefined ||
      displayedAt.length === 0
    ) {
      throw new Error(
        "Метаданные изменения приёма заказов имеют неверный формат.",
      );
    }

    return { actor, displayedAt: displayedAt.join(" ") };
  }

  async readChangedIntakeMetadata(
    previousMetadata: IntakeChangeMetadata,
  ): Promise<IntakeChangeMetadata> {
    await expect(
      this.intakeChangeMetadata(),
      "Метаданные последнего изменения приёма заказов обновлены.",
    ).not.toHaveText(
      `Изменил ${previousMetadata.actor} ${previousMetadata.displayedAt}`,
    );

    return this.readIntakeChangeMetadata();
  }

  async isEmptyVisible(): Promise<boolean> {
    return this.emptyTitle().isVisible();
  }

  async isEmptyDescriptionVisible(): Promise<boolean> {
    return this.emptyDescription().isVisible();
  }

  private async setItemAvailability(
    name: string,
    state: AvailabilityState,
    itemType: string,
  ): Promise<void> {
    await test.step(`Установить доступность ${itemType} «${name}»: ${state}`, async () => {
      await this.setToggle(this.itemToggle(name), state, name);
    });
  }

  private async setToggle(
    toggle: Locator,
    state: AvailabilityState,
    label: string,
  ): Promise<boolean> {
    await expect(toggle, `Переключатель «${label}» доступен.`).toBeEnabled();

    const changed = (await toggle.getAttribute("aria-checked")) !== state;

    if (changed) {
      await toggle.click();
    }

    await expect(toggle, `Переключатель «${label}» обновлён.`).toHaveAttribute(
      "aria-checked",
      state,
    );
    await expect(
      toggle,
      `Сохранение переключателя «${label}» завершено.`,
    ).toBeEnabled();

    return changed;
  }

  private itemToggle(name: string): Locator {
    return this.screen.getByRole("switch", { name, exact: true });
  }

  private emptyTitle(): Locator {
    return this.screen.getByRole("heading", {
      name: "Меню пусто",
      exact: true,
    });
  }

  private emptyDescription(): Locator {
    return this.screen.getByText("Позиции появятся после добавления в меню", {
      exact: true,
    });
  }

  private intakeChangeMetadata(): Locator {
    return this.screen.getByText(/^Изменил /);
  }
}
