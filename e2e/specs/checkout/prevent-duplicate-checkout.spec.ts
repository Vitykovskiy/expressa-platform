import {
  expect,
  OrderHistoryStatus,
  OrderStatus,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer не получает второй заказ при одном быстром двойном
 * действии оформления.
 *
 * Предусловия: изолированный профиль `canonical` предоставляет «Капучино»
 * размера M; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer выбирает размер M.
 * 5. Customer выбирает добавку «Обычное молоко».
 * 6. Customer добавляет товар в корзину.
 * 7. Customer открывает корзину.
 * 8. Customer выполняет одно быстрое двойное действие оформления заказа.
 * 9. Customer открывает историю заказов.
 *
 * Ожидаемый результат:
 * - Customer видит страницу одного созданного заказа.
 * - В созданном заказе один «Капучино» размера M.
 * - История содержит этот заказ ровно один раз и увеличивается на один заказ.
 */
test("CHECKOUT-07: customer не получает второй заказ при повторном оформлении", async ({
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  orderHistory,
  publicMenu,
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
  const ordersBefore = await orderHistory.history.readOrderCount();
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
  await publicMenu.product.selectModifier("Обычное молоко");
  await publicMenu.product.addToCart();
  await checkout.cart.open();
  await checkout.cart.placeOrderTwice();
  const createdOrder = await customerOrder.details.readSnapshot();

  await test.step("Customer видит страницу одного созданного заказа.", async () => {
    expect(
      createdOrder.id,
      "Страница показывает идентификатор заказа.",
    ).toMatch(/^[0-9a-f-]{36}$/u);
    expect(createdOrder.number, "Страница показывает номер заказа.").toMatch(
      /^\d{8}-\d{3}$/u,
    );
    expect(createdOrder.status, "Заказ находится на стадии «Оформлен».").toBe(
      OrderStatus.CREATED,
    );
  });
  await test.step("В созданном заказе один «Капучино» размера M.", async () => {
    expect(
      await customerOrder.details.readItemsCount(),
      "В заказе одна позиция.",
    ).toBe(1);
    expect(createdOrder.productName, "В заказе указан «Капучино».").toBe(
      "Капучино",
    );
    expect(createdOrder.size, "В заказе указан размер M.").toBe("Размер M");
  });
  await orderHistory.open();
  await test.step("История содержит этот заказ ровно один раз и увеличивается на один заказ.", async () => {
    await orderHistory.history.waitUntilLoaded();
    const entry = await orderHistory.history.readOrder(createdOrder);

    expect(entry.number, "История содержит номер созданного заказа.").toBe(
      createdOrder.number,
    );
    expect(entry.status, "История содержит стадию «Оформлен».").toBe(
      OrderHistoryStatus.CREATED,
    );
    expect(entry.total, "История содержит итог созданного заказа.").toBe(
      createdOrder.total,
    );
    expect(
      await orderHistory.history.readOrderCount(),
      "История увеличилась только на один заказ.",
    ).toBe(ordersBefore + 1);
  });
});
