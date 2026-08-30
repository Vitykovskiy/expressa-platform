import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer не повторяет полностью недоступный выданный заказ.
 *
 * Предусловия: изолированный профиль `order-repeat-unavailable` предоставляет
 * customer выданный заказ №20300102-001 с недоступным «Капучино»; корзина
 * нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer открывает выданный заказ.
 * 3. Customer нажимает «Повторить заказ».
 *
 * Ожидаемый результат:
 * - Customer видит пустую корзину.
 * - Customer видит предупреждение о «Капучино» с причиной непереноса.
 */
test("ORDER-08: customer не повторяет полностью недоступный выданный заказ", async ({
  page,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  orderHistory,
}) => {
  const order = {
    id: "00000000-0000-4000-8000-000000000001",
    number: "20300102-001",
  };

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
  await orderHistory.history.openOrder(order);
  await customerOrder.details.repeatOrder();

  await expectedResult("Customer видит пустую корзину.", page, async () => {
    expect(await checkout.isCartOpen(), "Корзина открыта.").toBe(true);
    expect(await checkout.cart.isEmpty(), "В корзине нет позиций.").toBe(true);
    expect(
      await checkout.cart.isEmptyStateVisible(),
      "Показано пустое состояние корзины.",
    ).toBe(true);
  });
  await expectedResult(
    "Customer видит предупреждение о «Капучино» с причиной непереноса.",
    page,
    async () => {
      const warning = await checkout.cart.readRepeatWarning("Капучино");

      expect(warning.productName, "Показано имя недоступной позиции.").toBe(
        "Капучино",
      );
      expect(warning.reason, "Показана причина непереноса позиции.").not.toBe(
        "",
      );
    },
  );
});
