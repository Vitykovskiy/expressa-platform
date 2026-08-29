import { expect, OrderQueueStage, OrderStatus, test } from "@fixtures/test";

/**
 * Назначение: сотрудник видит подготовленные заказы в очереди.
 *
 * Предусловия: изолированный профиль `queue-populated` содержит заказы №20300102-001—005 на стадиях «Оформлен», «Принят», «Готовится», «Готов» и «Выдан»; staff может войти через UI.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 *
 * Ожидаемый результат:
 * - Для каждого подготовленного заказа показана карточка.
 * - Карточки показывают номер, дату и время, текущую стадию и сумму заказа.
 */
test("QUEUE-02: сотрудник видит заполненную очередь заказов", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  staffOrders,
}) => {
  const orders = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      number: "20300102-001",
      productName: "Капучино",
      size: "M",
      modifierName: "Обычное молоко",
      quantity: "1",
      lineTotal: "320,00 ₽",
      total: "320,00 ₽",
      status: OrderStatus.CREATED,
      stage: OrderQueueStage.CREATED,
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      number: "20300102-002",
      productName: "Капучино",
      size: "M",
      modifierName: "Обычное молоко",
      quantity: "1",
      lineTotal: "320,00 ₽",
      total: "320,00 ₽",
      status: OrderStatus.ACCEPTED,
      stage: OrderQueueStage.ACCEPTED,
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      number: "20300102-003",
      productName: "Капучино",
      size: "M",
      modifierName: "Обычное молоко",
      quantity: "1",
      lineTotal: "320,00 ₽",
      total: "320,00 ₽",
      status: OrderStatus.PREPARING,
      stage: OrderQueueStage.PREPARING,
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      number: "20300102-004",
      productName: "Капучино",
      size: "M",
      modifierName: "Обычное молоко",
      quantity: "1",
      lineTotal: "320,00 ₽",
      total: "320,00 ₽",
      status: OrderStatus.READY,
      stage: OrderQueueStage.READY,
    },
    {
      id: "00000000-0000-4000-8000-000000000005",
      number: "20300102-005",
      productName: "Капучино",
      size: "M",
      modifierName: "Обычное молоко",
      quantity: "1",
      lineTotal: "320,00 ₽",
      total: "320,00 ₽",
      status: OrderStatus.ISSUED,
      stage: OrderQueueStage.ISSUED,
    },
  ];

  await test.step("Подготовка: staff авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });

  await staffOrders.open();
  await test.step("Для каждого подготовленного заказа показана карточка.", async () => {
    for (const order of orders)
      await staffOrders.queue.assertOrderVisible(order);
  });
  await test.step("Карточки показывают номер, дату и время, текущую стадию и сумму заказа.", async () => {
    for (const [position, order] of orders.entries()) {
      expect(
        await staffOrders.queue.readOrderCreatedAt(order),
        `Показаны дата и время заказа ${order.number}.`,
      ).toBe(`02.01.2030, 00:${(position + 1).toString().padStart(2, "0")}`);
      expect(
        await staffOrders.queue.readCurrentStage(order),
        `Показана стадия заказа ${order.number}.`,
      ).toBe(order.stage);
      expect(
        await staffOrders.queue.readOrderTotal(order),
        `Показана сумма заказа ${order.number}.`,
      ).toBe("320,00 ₽");
    }
  });
});
