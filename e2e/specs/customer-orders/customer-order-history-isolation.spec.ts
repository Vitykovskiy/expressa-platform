import { expect, OrderHistoryStatus, test } from "@fixtures/test";

/**
 * Назначение: история содержит только заказы авторизованного customer.
 *
 * Предусловия: изолированный профиль `customer-history` содержит 21 выданный заказ customer и заказ второго customer №20300102-022; customer может войти через UI.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer нажимает «Показать ещё».
 *
 * Ожидаемый результат:
 * - Customer видит все собственные заказы.
 * - Customer не видит карточку заказа второго customer.
 */
test("ORDER-05: история customer изолирована от заказов другого customer", async ({
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
  await orderHistory.history.loadMore();
  await test.step("Customer видит все собственные заказы.", async () => {
    const orders = await orderHistory.history.readOrders();

    expect(orders, "Показан двадцать один собственный заказ.").toHaveLength(21);
    for (const [position, order] of orders.entries()) {
      const index = 21 - position;
      const expectedDate = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(
        new Date(`2030-01-02T00:${index.toString().padStart(2, "0")}:00.000Z`),
      );

      expect(order.number, `Показан номер собственного заказа ${index}.`).toBe(
        `20300102-${index.toString().padStart(3, "0")}`,
      );
      expect(
        order.displayedDate,
        `Показана дата собственного заказа ${index}.`,
      ).toBe(expectedDate);
      expect(order.total, `Показана сумма собственного заказа ${index}.`).toBe(
        "320 ₽",
      );
      expect(
        order.status,
        `Показана стадия собственного заказа ${index}.`,
      ).toBe(OrderHistoryStatus.ISSUED);
    }
  });
  await test.step("Customer не видит карточку заказа второго customer.", async () => {
    expect(
      await orderHistory.history.isOrderAbsent("20300102-022"),
      "Карточка чужого заказа не показана.",
    ).toBe(true);
  });
});
