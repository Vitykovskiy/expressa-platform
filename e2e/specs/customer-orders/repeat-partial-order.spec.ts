import {
  CartItemSize,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer повторяет доступную часть выданного заказа.
 *
 * Предусловия: изолированный профиль `order-repeat-partial` предоставляет
 * customer выданный заказ №20300102-001 с доступным «Капучино» и недоступным
 * «Чизкейком»; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer открывает выданный заказ.
 * 3. Customer нажимает «Повторить заказ».
 *
 * Ожидаемый результат:
 * - Customer видит корзину с одним «Капучино».
 * - Customer видит сохранённые размер M, добавку «Обычное молоко» и количество 1.
 * - Customer видит предупреждение о «Чизкейке» с причиной непереноса.
 */
test("ORDER-07: customer повторяет доступную часть выданного заказа", async ({
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

  await test.step("Customer видит корзину с одним «Капучино».", async () => {
    expect(await checkout.isCartOpen(), "Корзина открыта.").toBe(true);
    expect(
      await checkout.cart.readItemsCount(),
      "В корзине показана одна доступная позиция.",
    ).toBe(1);
    expect(
      await checkout.cart.readItemName("Капучино", ProductConfiguratorSize.M, [
        "Обычное молоко",
      ]),
      "В корзине показан «Капучино».",
    ).toBe("Капучино");
  });
  await test.step("Customer видит сохранённые размер M, добавку «Обычное молоко» и количество 1.", async () => {
    expect(
      await checkout.cart.readItemVariant(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показан сохранённый размер M.",
    ).toBe(CartItemSize.M);
    expect(
      await checkout.cart.readItemModifiers(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показана сохранённая добавка.",
    ).toEqual(["+ Обычное молоко"]);
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показано сохранённое количество.",
    ).toBe(1);
  });
  await test.step("Customer видит предупреждение о «Чизкейке» с причиной непереноса.", async () => {
    const warning = await checkout.cart.readRepeatWarning("Чизкейк");

    expect(warning.productName, "Показано имя недоступной позиции.").toBe(
      "Чизкейк",
    );
    expect(warning.reason, "Показана причина непереноса позиции.").not.toBe("");
  });
});
