import {
  expect,
  OrderStatus,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: авторизованный customer оформляет корзину.
 *
 * Предусловия: изолированный профиль `canonical` предоставляет «Капучино»
 * размера M с «Обычным молоком»; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer выбирает размер M.
 * 5. Customer выбирает добавку «Обычное молоко».
 * 6. Customer добавляет товар в корзину.
 * 7. Customer открывает корзину.
 * 8. Customer оформляет заказ.
 *
 * Ожидаемый результат:
 * - Customer видит страницу созданного заказа.
 * - Заказ имеет номер и стадию «Оформлен».
 * - Страница показывает оплату на кассе при получении.
 * - Корзина customer очищается.
 */
test("CHECKOUT-01: авторизованный customer оформляет заказ", async ({
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
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
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
  await publicMenu.product.selectModifier("Обычное молоко");
  await publicMenu.product.addToCart();
  await checkout.cart.open();
  await checkout.cart.placeOrder();

  await test.step("Customer видит страницу созданного заказа.", async () => {
    expect(
      (await customerOrder.details.readReference()).id,
      "Страница показывает идентификатор созданного заказа.",
    ).toMatch(/^[0-9a-f-]{36}$/u);
  });
  await test.step("Заказ имеет номер и стадию «Оформлен».", async () => {
    const order = await customerOrder.details.readSnapshot();

    expect(order.number, "Заказ имеет человекочитаемый номер.").toMatch(
      /^\d+$/u,
    );
    expect(order.status, "Заказ находится на стадии «Оформлен».").toBe(
      OrderStatus.CREATED,
    );
  });
  await test.step("Страница показывает оплату на кассе при получении.", async () => {
    expect(
      await customerOrder.details.readPaymentMethod(),
      "Показан способ оплаты на кассе при получении.",
    ).toBe("Оплата на кассе при получении");
  });
  await test.step("Корзина customer очищается.", async () => {
    expect(
      await checkout.navigation.isCartEmpty(),
      "Навигация не показывает позиций в корзине.",
    ).toBe(true);
  });
});
