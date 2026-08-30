import {
  expectedResult,
  AvailabilityItemType,
  AvailabilityState,
  expect,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник включает товар, а customer видит его доступность в публичном меню.
 *
 * Предусловия: тестовое окружение предоставляет роли administrator и customer; seed-сценарий `product-unavailable` предоставляет недоступный товар «Капучино» в изолированном запуске.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник находит товар «Капучино».
 * 3. Сотрудник включает товар «Капучино».
 * 4. Customer открывает публичное меню.
 * 5. Customer открывает категорию «Кофе».
 *
 * Ожидаемый результат:
 * - В back-office товар «Капучино» отображается доступным.
 * - Customer может выбрать товар «Капучино» в публичном меню.
 */
test("AVAIL-04: сотрудник включает товар", async ({
  page,
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  publicMenu,
}) => {
  await test.step("Подготовка: administrator авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();
  await availabilityManagement.list.search("Капучино");
  await availabilityManagement.list.setItemAvailability(
    "Капучино",
    AvailabilityItemType.PRODUCT,
    AvailabilityState.AVAILABLE,
  );
  await expectedResult(
    "В back-office товар «Капучино» отображается доступным.",
    page,
    async () => {
      expect(
        await availabilityManagement.list.readItemAvailability("Капучино"),
        "Товар отмечен доступным.",
      ).toBe(AvailabilityState.AVAILABLE);
    },
  );
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await expectedResult(
    "Customer может выбрать товар «Капучино» в публичном меню.",
    page,
    async () => {
      expect(
        await publicMenu.product.isProductOpenable("Капучино"),
        "Доступный капучино можно выбрать в публичном меню.",
      ).toBe(true);
    },
  );
});
