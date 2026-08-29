import {
  AvailabilityItemType,
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer не оформляет корзину с недоступной позицией.
 *
 * Предусловия: изолированный профиль `canonical` предоставляет доступный
 * «Капучино» размера M; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer выбирает размер M.
 * 5. Customer выбирает добавку «Обычное молоко».
 * 6. Customer добавляет товар в корзину.
 * 7. Staff открывает управление доступностью.
 * 8. Staff выключает «Капучино».
 * 9. Customer открывает публичное меню.
 * 10. Customer открывает корзину.
 * 11. Customer начинает оформление для проверки доступности.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение о недоступной позиции.
 * - Корзина выделяет недоступный «Капучино» размера M.
 * - Customer не может оформить корзину, пока не удалит недоступную позицию.
 */
test("CHECKOUT-05: customer не оформляет корзину с недоступной позицией", async ({
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  multiSession,
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
  await test.step("Подготовка: staff авторизуется", async () => {
    await multiSession.staff.auth.open(e2eEnvironment.backOfficeUrl);
    await multiSession.staff.auth.form.signIn(e2eCredentials.staff);
  });
  await multiSession.staff.availabilityManagement.open();
  await multiSession.staff.availabilityManagement.list.setItemAvailability(
    "Капучино",
    AvailabilityItemType.PRODUCT,
    AvailabilityState.UNAVAILABLE,
  );
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await checkout.cart.open();
  await checkout.cart.requestAvailabilityRevalidation();

  await test.step("Customer видит сообщение о недоступной позиции.", async () => {
    expect(
      await checkout.cart.isUnavailableItemMessageVisible(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Сообщение о недоступности «Капучино» показано.",
    ).toBe(true);
  });
  await test.step("Корзина выделяет недоступный «Капучино» размера M.", async () => {
    expect(
      await checkout.cart.isItemUnavailable(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Позиция связана с сообщением о недоступности.",
    ).toBe(true);
  });
  await test.step("Customer не может оформить корзину, пока не удалит недоступную позицию.", async () => {
    expect(
      await checkout.cart.isCheckoutEnabled(),
      "Кнопка оформления недоступна.",
    ).toBe(false);
  });
});
