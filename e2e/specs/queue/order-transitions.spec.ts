import {
  expectedResult,
  expect,
  OrderQueueStage,
  OrderQueueTransitionAction,
  OrderStatus,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник проводит оформленный заказ по разрешённой последовательности стадий до выдачи.
 *
 * Предусловия: изолированный профиль `order-created` содержит оформленный заказ customer №20300102-001; staff может войти через UI.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник открывает детали заказа №20300102-001.
 * 3. Сотрудник переводит заказ из стадии «Оформлен» в «Принят».
 * 4. Сотрудник переводит заказ из стадии «Принят» в «Готовится».
 * 5. Сотрудник переводит заказ из стадии «Готовится» в «Готов».
 * 6. Сотрудник выдаёт готовый заказ.
 *
 * Ожидаемый результат:
 * - Для оформленного заказа доступен только переход в «Принят».
 * - После принятия карточка показывает стадию «Принят», а детали предлагают начать приготовление.
 * - После начала приготовления карточка показывает стадию «Готовится», а детали предлагают отметить готовность.
 * - После отметки готовности карточка показывает стадию «Готов», а детали предлагают выдачу.
 * - После выдачи карточка показывает стадию «Выдан», действия в деталях нет, история содержит четыре перехода.
 */
test("QUEUE-07: сотрудник проводит заказ по разрешённым стадиям", async ({
  page,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  staffOrders,
}) => {
  const order = {
    id: "00000000-0000-4000-8000-000000000001",
    number: "20300102-001",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320 ₽",
    total: "320 ₽",
    status: OrderStatus.CREATED,
  };

  await test.step("Подготовка: staff авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });

  await staffOrders.open();
  await staffOrders.queue.openDetails(order);
  const initialTransitions =
    await staffOrders.queue.readAvailableTransitions(order);
  await expectedResult(
    "Для оформленного заказа доступен только переход в «Принят».",
    page,
    async () => {
      expect(
        initialTransitions,
        "Переходы с пропуском стадии не показаны.",
      ).toEqual([OrderQueueTransitionAction.ACCEPT]);
    },
  );
  await staffOrders.queue.transition(order, OrderQueueTransitionAction.ACCEPT);
  await expectedResult(
    "После принятия карточка показывает стадию «Принят», а детали предлагают начать приготовление.",
    page,
    async () => {
      expect(
        await staffOrders.queue.readCurrentStage(order),
        "Карточка показывает стадию «Принят».",
      ).toBe(OrderQueueStage.ACCEPTED);
      expect(
        await staffOrders.queue.readAvailableTransitions(order),
        "Доступно начало приготовления.",
      ).toEqual([OrderQueueTransitionAction.START_PREPARING]);
    },
  );
  await staffOrders.queue.transition(
    order,
    OrderQueueTransitionAction.START_PREPARING,
  );
  await expectedResult(
    "После начала приготовления карточка показывает стадию «Готовится», а детали предлагают отметить готовность.",
    page,
    async () => {
      expect(
        await staffOrders.queue.readCurrentStage(order),
        "Карточка показывает стадию «Готовится».",
      ).toBe(OrderQueueStage.PREPARING);
      expect(
        await staffOrders.queue.readAvailableTransitions(order),
        "Доступна отметка готовности.",
      ).toEqual([OrderQueueTransitionAction.MARK_READY]);
    },
  );
  await staffOrders.queue.transition(
    order,
    OrderQueueTransitionAction.MARK_READY,
  );
  await expectedResult(
    "После отметки готовности карточка показывает стадию «Готов», а детали предлагают выдачу.",
    page,
    async () => {
      expect(
        await staffOrders.queue.readCurrentStage(order),
        "Карточка показывает стадию «Готов».",
      ).toBe(OrderQueueStage.READY);
      expect(
        await staffOrders.queue.readAvailableTransitions(order),
        "Доступна выдача заказа.",
      ).toEqual([OrderQueueTransitionAction.ISSUE]);
    },
  );
  await staffOrders.queue.transition(order, OrderQueueTransitionAction.ISSUE);
  await expectedResult(
    "После выдачи карточка показывает стадию «Выдан», действия в деталях нет, история содержит четыре перехода.",
    page,
    async () => {
      const history = await staffOrders.queue.readTransitionHistory(order);

      expect(
        await staffOrders.queue.readCurrentStage(order),
        "Карточка показывает стадию «Выдан».",
      ).toBe(OrderQueueStage.ISSUED);
      expect(
        await staffOrders.queue.readAvailableTransitions(order),
        "Действия перехода нет.",
      ).toEqual([]);
      expect(history, "История содержит четыре перехода.").toHaveLength(4);
      const expectedTransitions = [
        [OrderQueueStage.CREATED, OrderQueueStage.ACCEPTED],
        [OrderQueueStage.ACCEPTED, OrderQueueStage.PREPARING],
        [OrderQueueStage.PREPARING, OrderQueueStage.READY],
        [OrderQueueStage.READY, OrderQueueStage.ISSUED],
      ] as const;

      for (const [index, [from, to]] of expectedTransitions.entries()) {
        const transition = history[index];

        expect(
          transition?.from,
          `Показана исходная стадия перехода ${index + 1}.`,
        ).toBe(from);
        expect(
          transition?.to,
          `Показана новая стадия перехода ${index + 1}.`,
        ).toBe(to);
        expect(transition?.author, `Показан автор перехода ${index + 1}.`).toBe(
          e2eCredentials.staff.phone,
        );
        expect(
          transition?.occurredAt,
          `Показаны допустимые дата и время перехода ${index + 1}.`,
        ).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/u);
      }
    },
  );
});
