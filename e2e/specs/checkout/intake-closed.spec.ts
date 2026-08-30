import {
  expectedResult,
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer видит закрытый приём новых заказов при оформлении.
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
 * 8. Staff закрывает приём новых заказов.
 * 9. Customer открывает публичное меню.
 * 10. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение о закрытом приёме новых заказов.
 * - Customer не может выбрать оформление заказа.
 */
test("CHECKOUT-06: customer видит закрытый приём заказов", async ({
  page,
  availabilityManagement,
  backOfficeAuth,
  checkout,
  customerAuth,
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
  await test.step("Подготовка: staff авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.staff);
  });
  await availabilityManagement.open();
  await availabilityManagement.list.setIntake(AvailabilityState.UNAVAILABLE);
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await checkout.cart.open();

  await expectedResult(
    "Customer видит сообщение о закрытом приёме новых заказов.",
    page,
    async () => {
      expect(
        await checkout.cart.isIntakeClosedVisible(),
        "Показано сообщение о временно закрытом приёме заказов.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Customer не может выбрать оформление заказа.",
    page,
    async () => {
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Кнопка оформления заказа недоступна.",
      ).toBe(false);
    },
  );
});
