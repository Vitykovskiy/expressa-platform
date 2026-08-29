import {
  AvailabilityItemType,
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник включает размер напитка, а customer видит его доступность.
 *
 * Предусловия: тестовое окружение предоставляет роли administrator и customer; seed-сценарий `size-unavailable` предоставляет недоступный размер «Капучино · M» в изолированном запуске.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник находит размер «Капучино · M».
 * 3. Сотрудник включает размер «Капучино · M».
 * 4. Customer открывает публичное меню.
 * 5. Customer открывает категорию «Кофе».
 * 6. Customer открывает карточку товара «Капучино».
 *
 * Ожидаемый результат:
 * - В back-office размер «Капучино · M» отображается доступным.
 * - Customer может выбрать размер M для «Капучино».
 */
test("AVAIL-08: сотрудник включает размер напитка", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  publicMenu,
}) => {
  const sizeName = "Капучино · M";
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
    sizeName,
    AvailabilityItemType.SIZE,
    AvailabilityState.AVAILABLE,
  );
  await test.step("В back-office размер «Капучино · M» отображается доступным.", async () => {
    expect(
      await availabilityManagement.list.readItemAvailability(sizeName),
      "Размер отмечен доступным.",
    ).toBe(AvailabilityState.AVAILABLE);
  });
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await test.step("Customer может выбрать размер M для «Капучино».", async () => {
    expect(
      await publicMenu.product.isVariantSelectable(ProductConfiguratorSize.M),
      "Размер M доступен для выбора.",
    ).toBe(true);
  });
});
