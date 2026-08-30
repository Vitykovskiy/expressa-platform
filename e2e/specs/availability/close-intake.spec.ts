import {
  expectedResult,
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник закрывает приём новых заказов, сохраняя customer доступ к меню.
 *
 * Предусловия: тестовое окружение предоставляет роли administrator и customer; seed-сценарий `canonical` предоставляет доступный «Капучино» размера M и открытый приём новых заказов в изолированном запуске.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает товар «Капучино».
 * 4. Customer выбирает размер M.
 * 5. Customer добавляет товар в корзину.
 * 6. Сотрудник открывает раздел доступности.
 * 7. Сотрудник выключает приём новых заказов.
 * 8. Customer открывает публичное меню.
 * 9. Customer открывает категорию «Кофе».
 * 10. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - Back-office показывает, что приём новых заказов остановлен.
 * - Customer видит публичное меню.
 * - Customer видит сообщение о закрытом приёме новых заказов.
 * - Customer не может выбрать оформление заказа.
 */
test("AVAIL-05: сотрудник закрывает приём новых заказов", async ({
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
  await publicMenu.product.addToCart();
  await test.step("Подготовка: administrator авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();
  await availabilityManagement.list.setIntake(AvailabilityState.UNAVAILABLE);
  await expectedResult(
    "Back-office показывает, что приём новых заказов остановлен.",
    page,
    async () => {
      expect(
        await availabilityManagement.list.readIntakeAvailability(),
        "Приём новых заказов остановлен.",
      ).toBe(AvailabilityState.UNAVAILABLE);
    },
  );
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await expectedResult("Customer видит публичное меню.", page, async () => {
    expect(
      await publicMenu.product.isProductVisible("Капучино"),
      "Доступный капучино показан в публичном меню.",
    ).toBe(true);
  });
  await checkout.cart.open();
  await expectedResult(
    "Customer видит сообщение о закрытом приёме новых заказов.",
    page,
    async () => {
      expect(
        await checkout.cart.isIntakeClosedVisible(),
        "Сообщение о закрытом приёме новых заказов показано.",
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
