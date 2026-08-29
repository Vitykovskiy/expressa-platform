import { expect, OrderQueueStage, OrderStatus, test } from "@fixtures/test";

/**
 * Назначение: сотрудник открывает состав и историю изменения стадии заказа.
 *
 * Предусловия: изолированный профиль `queue-populated` содержит принятый заказ customer №20300102-002 с «Капучино» размера M, «Обычным молоком» и переходом «Оформлен» → «Принят»; staff может войти через UI.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник открывает детали заказа №20300102-002.
 *
 * Ожидаемый результат:
 * - Детали показывают клиента, состав, количество, размер и добавку позиции.
 * - Детали показывают сумму заказа.
 * - История стадий показывает переход «Оформлен» → «Принят», время и автора.
 */
test("QUEUE-05: сотрудник открывает детали заказа", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  staffOrders,
}) => {
  const order = {
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

  await test.step("Подготовка: staff авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });

  await staffOrders.open();
  await staffOrders.queue.openDetails(order);
  await test.step("Детали показывают клиента, состав, количество, размер и добавку позиции.", async () => {
    const details = await staffOrders.queue.readDetails(order);

    expect(details.customer, "Показан телефон клиента заказа.").toBe(
      e2eCredentials.customer.phone,
    );
    expect(details.items, "Показана единственная позиция заказа.").toHaveLength(
      1,
    );
    expect(details.items[0], "Показан снимок позиции заказа.").toBe(
      "Капучино, M × 1 — 320,00 ₽ (Обычное молоко)",
    );
  });
  await test.step("Детали показывают сумму заказа.", async () => {
    expect(
      await staffOrders.queue.readOrderTotal(order),
      "Показана сумма заказа.",
    ).toBe("320,00 ₽");
  });
  await test.step("История стадий показывает переход «Оформлен» → «Принят», время и автора.", async () => {
    const history = await staffOrders.queue.readTransitionHistory(order);

    expect(history, "История содержит один переход.").toHaveLength(1);
    expect(history[0]?.from, "Показана исходная стадия.").toBe(
      OrderQueueStage.CREATED,
    );
    expect(history[0]?.to, "Показана новая стадия.").toBe(
      OrderQueueStage.ACCEPTED,
    );
    expect(history[0]?.occurredAt, "Показано точное время перехода.").toBe(
      "02.01.2030, 00:02",
    );
    expect(history[0]?.author, "Показан автор перехода.").not.toBe("");
  });
});
