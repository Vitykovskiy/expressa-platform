import { expect, test } from "@playwright/test";

import {
  OrderQueueFilter,
  OrderQueueStage,
  OrderQueueTransitionAction,
} from "./order-queue.types";

import type { Locator, Page } from "@playwright/test";
import type { OrderSnapshot } from "@support/data/order-snapshot.types";
import type {
  OrderQueueDetails,
  OrderQueueTransition,
} from "./order-queue.types";

export class OrderQueueComponent {
  private readonly queue: Locator;
  private readonly loadingState: Locator;
  private readonly searchInput: Locator;
  private readonly refreshButton: Locator;

  constructor(private readonly page: Page) {
    this.queue = page.getByRole("region", { name: "Очередь заказов" });
    this.loadingState = this.queue.getByLabel("Загрузка очереди", {
      exact: true,
    });
    this.searchInput = this.queue.getByLabel("Номер заказа", { exact: true });
    this.refreshButton = this.queue.getByRole("button", {
      name: "Обновить очередь",
      exact: true,
    });
  }

  async waitReady(): Promise<void> {
    await expect(this.queue, "Очередь заказов показана.").toBeVisible();
    await expect(this.loadingState, "Загрузка очереди завершена.").toHaveCount(
      0,
    );
  }

  async selectFilter(filter: OrderQueueFilter): Promise<void> {
    await test.step(`Выбрать фильтр «${filter}»`, async () => {
      const filterButton = this.filterButton(filter);

      await expect(filterButton, `Фильтр «${filter}» доступен.`).toBeEnabled();
      await filterButton.click();
      await expect(filterButton, `Фильтр «${filter}» выбран.`).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await this.waitReady();
    });
  }

  async searchByNumber(number: string): Promise<void> {
    await test.step(`Найти заказ по номеру ${number}`, async () => {
      await expect(
        this.searchInput,
        "Поле поиска заказа доступно.",
      ).toBeEnabled();
      await this.searchInput.fill(number);
      await expect(
        this.searchInput,
        "В поле поиска указан номер заказа.",
      ).toHaveValue(number);
      await this.waitReady();
    });
  }

  async clearSearch(): Promise<void> {
    await test.step("Очистить поиск заказов", async () => {
      await expect(
        this.searchInput,
        "Поле поиска заказа доступно.",
      ).toBeEnabled();
      await this.searchInput.fill("");
      await expect(this.searchInput, "Поле поиска очищено.").toHaveValue("");
      await this.waitReady();
    });
  }

  async refresh(): Promise<void> {
    await test.step("Обновить очередь заказов", async () => {
      await expect(
        this.refreshButton,
        "Кнопка обновления очереди доступна.",
      ).toBeEnabled();
      await this.refreshButton.click();
      await this.waitReady();
    });
  }

  async isEmptyVisible(): Promise<boolean> {
    return this.emptyTitle().isVisible();
  }

  async isEmptyDescriptionVisible(): Promise<boolean> {
    return this.emptyDescription().isVisible();
  }

  async assertOrderVisible(order: OrderSnapshot): Promise<void> {
    await expect(
      this.orderCard(order),
      `Заказ ${order.number} показан в очереди.`,
    ).toBeVisible();
  }

  async assertOrderHidden(order: OrderSnapshot): Promise<void> {
    await expect(
      this.orderCard(order),
      `Заказ ${order.number} не показан в очереди.`,
    ).toHaveCount(0);
  }

  async openDetails(
    order: Pick<OrderSnapshot, "id" | "number">,
  ): Promise<void> {
    await test.step(`Открыть детали заказа ${order.number}`, async () => {
      const card = this.orderCard(order);

      await expect(card, "Созданный заказ показан в очереди.").toBeVisible();
      await expect(
        card.getByRole("button", { name: "Открыть детали", exact: true }),
        "Кнопка открытия деталей доступна.",
      ).toBeEnabled();
      await card
        .getByRole("button", { name: "Открыть детали", exact: true })
        .click();
      await expect(
        card.getByRole("region", {
          name: `Детали заказа ${order.number}`,
          exact: true,
        }),
        "Детали заказа открыты.",
      ).toBeVisible();
    });
  }

  async transition(
    order: Pick<OrderSnapshot, "id" | "number">,
    action: OrderQueueTransitionAction,
  ): Promise<void> {
    await test.step(`${action} для заказа ${order.number}`, async () => {
      const card = this.orderCard(order);
      const transitionButton = this.transitionButton(card, action);

      await expect(
        transitionButton,
        `Действие «${action}» доступно.`,
      ).toBeEnabled();
      await transitionButton.click();
      await expect(
        card.getByText(this.transitionStage(action), { exact: true }),
        `Заказ перешёл в следующую стадию после действия «${action}».`,
      ).toBeVisible();
    });
  }

  async isOrderCreatedAtVisible(order: OrderSnapshot): Promise<boolean> {
    return this.orderCreatedAt(order).isVisible();
  }

  async readOrderCreatedAt(order: OrderSnapshot): Promise<string> {
    const createdAt = this.orderCreatedAt(order);

    await expect(
      createdAt,
      `Дата и время заказа ${order.number} показаны.`,
    ).toBeVisible();

    return createdAt.innerText();
  }

  async readOrderTotal(order: OrderSnapshot): Promise<string> {
    return this.orderCard(order)
      .getByText(order.total, { exact: true })
      .innerText();
  }

  async readDetails(order: OrderSnapshot): Promise<OrderQueueDetails> {
    const details = this.orderDetails(order);
    const lines = (await details.innerText())
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const customerLine = lines.find((line) => line.startsWith("Клиент:"));
    const customer = customerLine?.replace("Клиент:", "").trim();
    const items = await details
      .getByRole("list", { name: "Состав заказа", exact: true })
      .getByRole("listitem")
      .allInnerTexts();

    if (customer === undefined || customer === "" || items.length === 0) {
      throw new Error("Не удалось прочитать детали заказа в очереди.");
    }

    return { customer, items };
  }

  async readCurrentStage(order: OrderSnapshot): Promise<OrderQueueStage> {
    const card = this.orderCard(order);

    await expect(
      card,
      `Карточка заказа ${order.number} показана перед чтением стадии.`,
    ).toBeVisible();

    for (const stage of Object.values(OrderQueueStage)) {
      const stageLocator = card.getByText(stage, { exact: true });

      if ((await stageLocator.count()) === 0) continue;

      await expect(
        stageLocator,
        `Показана стадия «${stage}» заказа ${order.number}.`,
      ).toBeVisible();
      return stage;
    }

    throw new Error("Не удалось прочитать отображаемую стадию заказа.");
  }

  async readAvailableTransition(
    order: OrderSnapshot,
  ): Promise<OrderQueueTransitionAction | null> {
    const [transition] = await this.readAvailableTransitions(order);

    return transition ?? null;
  }

  async readAvailableTransitions(
    order: OrderSnapshot,
  ): Promise<readonly OrderQueueTransitionAction[]> {
    const details = this.orderDetails(order);
    const transitions: OrderQueueTransitionAction[] = [];

    for (const action of Object.values(OrderQueueTransitionAction)) {
      if (
        await details
          .getByRole("button", { name: action, exact: true })
          .isVisible()
      ) {
        transitions.push(action);
      }
    }

    return transitions;
  }

  async readTransitionHistory(
    order: OrderSnapshot,
  ): Promise<OrderQueueTransition[]> {
    const events = this.orderDetails(order)
      .getByRole("listitem")
      .filter({ hasText: "Автор:" });

    await expect(
      events,
      "История переходов заказа показана в деталях.",
    ).not.toHaveCount(0);

    return (await events.allInnerTexts()).map((event) =>
      this.readTransition(event),
    );
  }

  private orderCard(order: Pick<OrderSnapshot, "id" | "number">): Locator {
    return this.page.getByTestId("staff-order-card").filter({
      has: this.page.getByText(order.number, { exact: true }),
    });
  }

  private orderDetails(order: Pick<OrderSnapshot, "id" | "number">): Locator {
    return this.orderCard(order).getByRole("region", {
      name: `Детали заказа ${order.number}`,
      exact: true,
    });
  }

  private orderCreatedAt(order: Pick<OrderSnapshot, "id" | "number">): Locator {
    return this.orderCard(order).getByText(
      /^\d{2}\.\d{2}\.\d{2,4}, \d{2}:\d{2}$/u,
    );
  }

  private filterButton(filter: OrderQueueFilter): Locator {
    return this.queue.getByRole("button", { name: filter, exact: true });
  }

  private transitionButton(
    card: Locator,
    action: OrderQueueTransitionAction,
  ): Locator {
    return card.getByRole("button", { name: action, exact: true });
  }

  private transitionStage(action: OrderQueueTransitionAction): OrderQueueStage {
    switch (action) {
      case OrderQueueTransitionAction.ACCEPT:
        return OrderQueueStage.ACCEPTED;
      case OrderQueueTransitionAction.START_PREPARING:
        return OrderQueueStage.PREPARING;
      case OrderQueueTransitionAction.MARK_READY:
        return OrderQueueStage.READY;
      case OrderQueueTransitionAction.ISSUE:
        return OrderQueueStage.ISSUED;
    }
  }

  private emptyTitle(): Locator {
    return this.queue.getByRole("heading", {
      name: "Заказов нет",
      exact: true,
    });
  }

  private emptyDescription(): Locator {
    return this.queue.getByText("Активные заказы появятся здесь", {
      exact: true,
    });
  }

  private readTransition(event: string): OrderQueueTransition {
    const parsedTransition = event.match(
      /^(?<from>.+) — (?<to>.+), (?<occurredAt>(?<day>\d{2})\.(?<month>\d{2})\.(?<year>\d{4}), (?<hours>\d{2}):(?<minutes>\d{2})), Автор: (?<author>.+)$/u,
    );
    const from = parsedTransition?.groups?.["from"];
    const to = parsedTransition?.groups?.["to"];
    const occurredAt = parsedTransition?.groups?.["occurredAt"];
    const author = parsedTransition?.groups?.["author"];
    const day = Number(parsedTransition?.groups?.["day"]);
    const month = Number(parsedTransition?.groups?.["month"]);
    const year = Number(parsedTransition?.groups?.["year"]);
    const hours = Number(parsedTransition?.groups?.["hours"]);
    const minutes = Number(parsedTransition?.groups?.["minutes"]);

    if (
      !this.isOrderQueueStage(from) ||
      !this.isOrderQueueStage(to) ||
      occurredAt === undefined ||
      author === undefined ||
      author === "" ||
      !this.isValidDateTime(day, month, year, hours, minutes)
    ) {
      throw new Error("Не удалось прочитать переход статуса заказа.");
    }

    return { author, from, occurredAt, to };
  }

  private isValidDateTime(
    day: number,
    month: number,
    year: number,
    hours: number,
    minutes: number,
  ): boolean {
    const timestamp = new Date(year, month - 1, day, hours, minutes);

    return (
      timestamp.getDate() === day &&
      timestamp.getMonth() === month - 1 &&
      timestamp.getFullYear() === year &&
      timestamp.getHours() === hours &&
      timestamp.getMinutes() === minutes
    );
  }

  private isOrderQueueStage(
    value: string | undefined,
  ): value is OrderQueueStage {
    return Object.values(OrderQueueStage).includes(value as OrderQueueStage);
  }
}
