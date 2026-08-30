import {
  expectedResult,
  AvailabilityItemType,
  AvailabilityState,
  expect,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник включает добавку, а customer видит её доступность.
 *
 * Предусловия: тестовое окружение предоставляет роли administrator и customer; seed-сценарий `modifier-unavailable` предоставляет недоступную добавку «Молоко · Овсяное молоко» в изолированном запуске.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник находит добавку «Молоко · Овсяное молоко».
 * 3. Сотрудник включает добавку «Молоко · Овсяное молоко».
 * 4. Customer открывает публичное меню.
 * 5. Customer открывает категорию «Кофе».
 * 6. Customer открывает карточку товара «Капучино».
 *
 * Ожидаемый результат:
 * - В back-office добавка «Молоко · Овсяное молоко» отображается доступной.
 * - Customer может выбрать добавку «Овсяное молоко» для «Капучино».
 */
test("AVAIL-10: сотрудник включает добавку", async ({
  page,
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
    AvailabilityState.AVAILABLE,
  );
  await expectedResult(
    "В back-office добавка «Молоко · Овсяное молоко» отображается доступной.",
    page,
    async () => {
      expect(
        await availabilityManagement.list.readItemAvailability(modifierName),
        "Добавка «Молоко · Овсяное молоко» доступна.",
      ).toBe(AvailabilityState.AVAILABLE);
    },
  );
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await expectedResult(
    "Customer может выбрать добавку «Овсяное молоко» для «Капучино».",
    page,
    async () => {
      expect(
        await publicMenu.product.isModifierSelectable("Овсяное молоко"),
        "Добавка «Овсяное молоко» доступна для выбора.",
      ).toBe(true);
    },
  );
});
