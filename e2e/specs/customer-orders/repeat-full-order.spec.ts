import {
  CartItemSize,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer полностью повторяет выданный заказ.
 *
 * Предусловия: изолированный профиль `order-issued` содержит выданный заказ customer №20300102-001 с доступным «Капучино» размера M и «Обычным молоком»; корзина нового browser context пуста; customer может войти через UI.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer открывает выданный заказ.
 * 3. Customer нажимает «Повторить заказ».
 *
 * Ожидаемый результат:
 * - Customer видит открывшуюся корзину.
 * - Корзина содержит прежние наименование, размер, добавку и количество позиции.
 * - Корзина показывает актуальные цену позиции и итоговую сумму.
 */
test("ORDER-06: customer повторяет полностью доступный выданный заказ", async ({
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
  await test.step("Customer видит открывшуюся корзину.", async () => {
    expect(await checkout.isCartOpen(), "Корзина открыта.").toBe(true);
  });
  await test.step("Корзина содержит прежние наименование, размер, добавку и количество позиции.", async () => {
    expect(
      await checkout.cart.readItemName("Капучино", ProductConfiguratorSize.M, [
        "Обычное молоко",
      ]),
      "Показано наименование позиции.",
    ).toBe("Капучино");
    expect(
      await checkout.cart.readItemVariant(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показан размер позиции.",
    ).toBe(CartItemSize.M);
    expect(
      await checkout.cart.readItemModifiers(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показана добавка позиции.",
    ).toEqual(["+ Обычное молоко"]);
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показано количество позиции.",
    ).toBe(1);
  });
  await test.step("Корзина показывает актуальные цену позиции и итоговую сумму.", async () => {
    expect(
      await checkout.cart.readItemLineTotal(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показана цена позиции.",
    ).toBe("320,00 ₽");
    expect(
      await checkout.cart.readTotal(),
      "Показана итоговая сумма корзины.",
    ).toBe("320,00 ₽");
  });
});
