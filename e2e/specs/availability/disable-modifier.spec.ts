import {
  AvailabilityItemType,
  AvailabilityState,
  expect,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник выключает добавку, а customer видит её недоступность.
 *
 * Предусловия: тестовое окружение предоставляет роли administrator и customer; seed-сценарий `canonical` предоставляет доступную добавку «Молоко · Овсяное молоко» в изолированном запуске.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник находит добавку «Молоко · Овсяное молоко».
 * 3. Сотрудник выключает добавку «Молоко · Овсяное молоко».
 * 4. Customer открывает публичное меню.
 * 5. Customer открывает категорию «Кофе».
 * 6. Customer открывает карточку товара «Капучино».
 *
 * Ожидаемый результат:
 * - В back-office добавка «Молоко · Овсяное молоко» отображается недоступной.
 * - Customer не может выбрать добавку «Овсяное молоко» для «Капучино».
 */
test("AVAIL-09: сотрудник выключает добавку", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  publicMenu,
}) => {
  const modifierName = "Молоко · Овсяное молоко";
  await test.step("Подготовка: administrator авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();
  await availabilityManagement.list.search("Овсяное молоко");
  await availabilityManagement.list.setItemAvailability(
    modifierName,
    AvailabilityItemType.MODIFIER,
    AvailabilityState.UNAVAILABLE,
  );
  await test.step("В back-office добавка «Молоко · Овсяное молоко» отображается недоступной.", async () => {
    expect(
      await availabilityManagement.list.readItemAvailability(modifierName),
      "Добавка отмечена недоступной.",
    ).toBe(AvailabilityState.UNAVAILABLE);
  });
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await test.step("Customer не может выбрать добавку «Овсяное молоко» для «Капучино».", async () => {
    expect(
      await publicMenu.product.isModifierSelectable("Овсяное молоко"),
      "Добавка «Овсяное молоко» недоступна для выбора.",
    ).toBe(false);
  });
});
