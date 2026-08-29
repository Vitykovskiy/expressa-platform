import {
  CartItemSize,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: гость подтверждает номер и возвращается к корзине.
 *
 * Предусловия: изолированный профиль `canonical` предоставляет «Капучино»
 * размера M; гость не авторизован, корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Гость открывает публичное меню.
 * 2. Гость открывает категорию «Кофе».
 * 3. Гость открывает «Капучино».
 * 4. Гость выбирает размер M.
 * 5. Гость выбирает добавку «Обычное молоко».
 * 6. Гость добавляет товар в корзину.
 * 7. Гость открывает корзину.
 * 8. Гость начинает оформление.
 * 9. Гость указывает номер телефона.
 * 10. Гость запрашивает одноразовый код.
 * 11. Гость указывает одноразовый код.
 * 12. Гость подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Customer возвращается к корзине после подтверждения номера.
 * - Корзина содержит «Капучино» размера M с «Обычным молоком».
 * - Корзина показывает количество 1 и итог 320 ₽.
 * - Customer может продолжить оформление заказа.
 */
test("CHECKOUT-02: гость возвращается к оформлению после OTP", async ({
  checkout,
  e2eCredentials,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
  await publicMenu.product.selectModifier("Обычное молоко");
  await publicMenu.product.addToCart();
  await checkout.cart.open();
  await checkout.cart.startCheckout();
  await checkout.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await checkout.phoneVerification.requestCode();
  await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await checkout.phoneVerification.confirm();

  await test.step("Customer возвращается к корзине после подтверждения номера.", async () => {
    expect(
      await checkout.isCartOpen(),
      "После подтверждения номера снова открыта корзина.",
    ).toBe(true);
  });
  await test.step("Корзина содержит «Капучино» размера M с «Обычным молоком».", async () => {
    expect(
      await checkout.cart.readItemName("Капучино", ProductConfiguratorSize.M, [
        "Обычное молоко",
      ]),
      "В корзине сохранён добавленный до входа товар.",
    ).toBe("Капучино");
    expect(
      await checkout.cart.readItemVariant(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "В корзине сохранён размер M.",
    ).toBe(CartItemSize.M);
    expect(
      await checkout.cart.readItemModifiers(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "В корзине сохранена добавка.",
    ).toEqual(["+ Обычное молоко"]);
  });
  await test.step("Корзина показывает количество 1 и итог 320 ₽.", async () => {
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Показано количество один.",
    ).toBe(1);
    expect(await checkout.cart.readTotal(), "Показан итог 320 ₽.").toBe(
      "320 ₽",
    );
  });
  await test.step("Customer может продолжить оформление заказа.", async () => {
    expect(
      await checkout.cart.isCheckoutEnabled(),
      "Кнопка оформления заказа доступна после подтверждения номера.",
    ).toBe(true);
  });
});
