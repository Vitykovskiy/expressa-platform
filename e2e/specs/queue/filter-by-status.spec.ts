import {
  expect,
  OrderQueueFilter,
  OrderQueueStage,
  OrderStatus,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник ограничивает очередь заказами выбранной стадии.
 *
 * Предусловия: изолированный профиль `queue-populated` содержит заказы №20300102-001 на стадии «Оформлен» и №20300102-003 на стадии «Готовится»; staff может войти через UI.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник выбирает фильтр «Новые».
 * 3. Сотрудник выбирает фильтр «Готовятся».
 * 4. Сотрудник выбирает фильтр «Все».
 *
 * Ожидаемый результат:
 * - После выбора «Новые» показан только оформленный заказ.
 * - После выбора «Готовятся» показан только готовящийся заказ.
 * - После выбора «Все» показаны все подготовленные заказы №20300102-001—005.
 */
test("QUEUE-03: сотрудник фильтрует очередь по стадии", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  staffOrders,
}) => {
  const created = {
    id: "00000000-0000-4000-8000-000000000001",
    number: "20300102-001",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320,00 ₽",
    total: "320,00 ₽",
    status: OrderStatus.CREATED,
  };
  const preparing = {
    id: "00000000-0000-4000-8000-000000000003",
    number: "20300102-003",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320,00 ₽",
    total: "320,00 ₽",
    status: OrderStatus.PREPARING,
  };
  const ready = {
    id: "00000000-0000-4000-8000-000000000004",
    number: "20300102-004",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320,00 ₽",
    total: "320,00 ₽",
    status: OrderStatus.READY,
  };
  const accepted = {
    id: "00000000-0000-4000-8000-000000000002",
    number: "20300102-002",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320,00 ₽",
    total: "320,00 ₽",
    status: OrderStatus.ACCEPTED,
  };
  const issued = {
    id: "00000000-0000-4000-8000-000000000005",
    number: "20300102-005",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320,00 ₽",
    total: "320,00 ₽",
    status: OrderStatus.ISSUED,
  };

  await test.step("Подготовка: staff авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });

  await staffOrders.open();
  await staffOrders.queue.selectFilter(OrderQueueFilter.CREATED);
  await test.step("После выбора «Новые» показан только оформленный заказ.", async () => {
    expect(
      await staffOrders.queue.readCurrentStage(created),
      "Показана стадия «Оформлен».",
    ).toBe(OrderQueueStage.CREATED);
    await staffOrders.queue.assertOrderHidden(accepted);
    await staffOrders.queue.assertOrderHidden(preparing);
    await staffOrders.queue.assertOrderHidden(ready);
    await staffOrders.queue.assertOrderHidden(issued);
  });
  await staffOrders.queue.selectFilter(OrderQueueFilter.PREPARING);
  await test.step("После выбора «Готовятся» показан только готовящийся заказ.", async () => {
    expect(
      await staffOrders.queue.readCurrentStage(preparing),
      "Показана стадия «Готовится».",
    ).toBe(OrderQueueStage.PREPARING);
    await staffOrders.queue.assertOrderHidden(created);
    await staffOrders.queue.assertOrderHidden(accepted);
    await staffOrders.queue.assertOrderHidden(ready);
    await staffOrders.queue.assertOrderHidden(issued);
  });
  await staffOrders.queue.selectFilter(OrderQueueFilter.ALL);
  await test.step("После выбора «Все» показаны все подготовленные заказы №20300102-001—005.", async () => {
    await staffOrders.queue.assertOrderVisible(created);
    await staffOrders.queue.assertOrderVisible(accepted);
    await staffOrders.queue.assertOrderVisible(preparing);
    await staffOrders.queue.assertOrderVisible(ready);
    await staffOrders.queue.assertOrderVisible(issued);
  });
});
