import {
  expectedResult,
  AvailabilityItemType,
  AvailabilityState,
  expect,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник выключает товар, а customer видит его недоступность в публичном меню.
 *
 * Предусловия: тестовое окружение предоставляет роли administrator и customer; seed-сценарий `canonical` предоставляет доступный товар «Капучино» в изолированном запуске.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник находит товар «Капучино».
 * 3. Сотрудник выключает товар «Капучино».
 * 4. Customer открывает публичное меню.
 * 5. Customer открывает категорию «Кофе».
 *
 * Ожидаемый результат:
 * - В back-office товар «Капучино» отображается недоступным.
 * - Customer не может выбрать недоступный товар «Капучино» в публичном меню.
 */
test("AVAIL-03: сотрудник выключает товар", async ({
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
    AvailabilityState.UNAVAILABLE,
  );
  await expectedResult(
    "В back-office товар «Капучино» отображается недоступным.",
    page,
    async () => {
      expect(
        await availabilityManagement.list.readItemAvailability("Капучино"),
        "Товар отмечен недоступным.",
      ).toBe(AvailabilityState.UNAVAILABLE);
    },
  );
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await expectedResult(
    "Customer не может выбрать недоступный товар «Капучино» в публичном меню.",
    page,
    async () => {
      expect(
        await publicMenu.product.isProductOpenable("Капучино"),
        "Недоступный капучино нельзя выбрать в публичном меню.",
      ).toBe(false);
    },
  );
});
