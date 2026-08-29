import { expect, OrderHistoryStatus, test } from "@fixtures/test";

/**
 * Назначение: customer загружает следующую часть собственной истории заказов.
 *
 * Предусловия: изолированный профиль `customer-history` содержит 21 выданный заказ customer; customer может войти через UI.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer нажимает «Показать ещё».
 *
 * Ожидаемый результат:
 * - Customer видит первую часть собственной истории от новых заказов к старым.
 * - Customer видит следующую часть истории без повторов заказов.
 */
test("ORDER-04: customer загружает следующую часть истории заказов", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  orderHistory,
}) => {
  await test.step("Подготовка: customer авторизуется", async () => {
    await customerAuth.open(e2eEnvironment.frontOfficeUrl);
    await customerAuth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await customerAuth.phoneVerification.requestCode();
    await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await customerAuth.phoneVerification.confirm();
  });

  await orderHistory.open();
  await orderHistory.history.waitUntilLoaded();
  await test.step("Customer видит первую часть собственной истории от новых заказов к старым.", async () => {
    const orders = await orderHistory.history.readOrders();

    expect(
      orders,
      "Первая часть истории содержит двадцать заказов.",
    ).toHaveLength(20);
    for (const [position, order] of orders.entries()) {
      const index = 21 - position;
      const expectedDate = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(
        new Date(`2030-01-02T00:${index.toString().padStart(2, "0")}:00.000Z`),
      );

      expect(order.number, `Показан номер заказа ${index}.`).toBe(
        `20300102-${index.toString().padStart(3, "0")}`,
      );
      expect(order.displayedDate, `Показана дата заказа ${index}.`).toBe(
        expectedDate,
      );
      expect(order.total, `Показана сумма заказа ${index}.`).toBe("320,00 ₽");
      expect(order.status, `Показана стадия заказа ${index}.`).toBe(
        OrderHistoryStatus.ISSUED,
      );
    }
  });

  await orderHistory.history.loadMore();
  await test.step("Customer видит следующую часть истории без повторов заказов.", async () => {
    const orders = await orderHistory.history.readOrders();

    expect(
      orders,
      "История содержит все двадцать один заказ customer.",
    ).toHaveLength(21);
    for (const [position, order] of orders.entries()) {
      const index = 21 - position;
      const expectedDate = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(
        new Date(`2030-01-02T00:${index.toString().padStart(2, "0")}:00.000Z`),
      );

      expect(order.number, `Показан номер заказа ${index}.`).toBe(
        `20300102-${index.toString().padStart(3, "0")}`,
      );
      expect(order.displayedDate, `Показана дата заказа ${index}.`).toBe(
        expectedDate,
      );
      expect(order.total, `Показана сумма заказа ${index}.`).toBe("320,00 ₽");
      expect(order.status, `Показана стадия заказа ${index}.`).toBe(
        OrderHistoryStatus.ISSUED,
      );
    }
    expect(
      await orderHistory.history.hasUniqueOrderNumbers(),
      "Повторяющихся заказов нет.",
    ).toBe(true);
  });
});
