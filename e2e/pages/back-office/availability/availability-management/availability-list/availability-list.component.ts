import { expect, test } from "@playwright/test";

import {
  AvailabilityItemType,
  AvailabilityState,
} from "./availability-list.types";

import type { Locator, Page } from "@playwright/test";
import type { IntakeChangeMetadata } from "./availability-list.types";

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

  async setItemAvailability(
    name: string,
    type: AvailabilityItemType,
    state: AvailabilityState,
  ): Promise<void> {
    await test.step(`Установить доступность ${type} «${name}»: ${state}`, async () => {
      await this.setToggle(this.itemToggle(name), state, name);
    });
  }

  async isItemVisible(name: string): Promise<boolean> {
    return this.itemToggle(name).isVisible();
  }

  async isCategoryVisible(name: string): Promise<boolean> {
    return this.screen.getByRole("heading", { name, exact: true }).isVisible();
  }

  async readItemAvailability(name: string): Promise<AvailabilityState> {
    return this.readAvailability(this.itemToggle(name), name);
  }

  async readIntakeAvailability(): Promise<AvailabilityState> {
    return this.readAvailability(this.intakeToggle, "Приём новых заказов");
  }

  async readIntakeChangeMetadata(): Promise<IntakeChangeMetadata> {
    const metadata = this.intakeChangeMetadata();

    await expect(
      metadata,
      "Метаданные последнего изменения приёма заказов показаны.",
    ).toBeVisible();

    const text = await metadata.textContent();
    const parsedMetadata = text?.match(
      /^Изменил (?<actor>.+) (?<displayedAt>(?<day>\d{2})\.(?<month>\d{2})\.(?<year>\d{4}), (?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2}))$/u,
    );

    const actor = parsedMetadata?.groups?.["actor"];
    const displayedAt = parsedMetadata?.groups?.["displayedAt"];
    const day = Number(parsedMetadata?.groups?.["day"]);
    const month = Number(parsedMetadata?.groups?.["month"]);
    const year = Number(parsedMetadata?.groups?.["year"]);
    const hours = Number(parsedMetadata?.groups?.["hours"]);
    const minutes = Number(parsedMetadata?.groups?.["minutes"]);
    const seconds = Number(parsedMetadata?.groups?.["seconds"]);

    if (
      actor === undefined ||
      displayedAt === undefined ||
      !this.isValidDateTime(day, month, year, hours, minutes, seconds)
    ) {
      throw new Error(
        "Метаданные изменения приёма заказов имеют неверный формат.",
      );
    }

    return { actor, displayedAt };
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

  private async setToggle(
    toggle: Locator,
    state: AvailabilityState,
    label: string,
  ): Promise<boolean> {
    await expect(toggle, `Переключатель «${label}» доступен.`).toBeEnabled();

    const changed = (await this.readAvailability(toggle, label)) !== state;

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

  private async readAvailability(
    toggle: Locator,
    label: string,
  ): Promise<AvailabilityState> {
    const state = await toggle.getAttribute("aria-checked");

    if (
      state !== AvailabilityState.AVAILABLE &&
      state !== AvailabilityState.UNAVAILABLE
    ) {
      throw new Error(`Переключатель «${label}» имеет неизвестное состояние.`);
    }

    return state;
  }

  private isValidDateTime(
    day: number,
    month: number,
    year: number,
    hours: number,
    minutes: number,
    seconds: number,
  ): boolean {
    const timestamp = new Date(year, month - 1, day, hours, minutes, seconds);

    return (
      timestamp.getDate() === day &&
      timestamp.getMonth() === month - 1 &&
      timestamp.getFullYear() === year &&
      timestamp.getHours() === hours &&
      timestamp.getMinutes() === minutes &&
      timestamp.getSeconds() === seconds
    );
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
