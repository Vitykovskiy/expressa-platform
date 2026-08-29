import { expect, test } from "@fixtures/test";

/**
 * Назначение: сотрудник показывает позиции только выбранной категории.
 *
 * Предусловия: тестовое окружение предоставляет роль administrator; seed-сценарий `canonical` предоставляет в изолированном запуске категории «Кофе» и «Выпечка» с товарами «Капучино» и «Круассан».
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выбирает категорию «Кофе».
 *
 * Ожидаемый результат:
 * - Список содержит товар «Капучино».
 * - Список не содержит товар «Круассан».
 */
test("AVAIL-13: сотрудник фильтрует позиции по категории", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await test.step("Подготовка: administrator авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();
  await availabilityManagement.list.selectCategory("Кофе");
  await test.step("Список содержит товар «Капучино».", async () => {
    expect(
      await availabilityManagement.list.isItemVisible("Капучино"),
      "Товар «Капучино» показан.",
    ).toBe(true);
  });
  await test.step("Список не содержит товар «Круассан».", async () => {
    expect(
      await availabilityManagement.list.isItemVisible("Круассан"),
      "Товар «Круассан» не показан.",
    ).toBe(false);
  });
});
