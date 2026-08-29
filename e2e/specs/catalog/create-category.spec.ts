import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить создание активной категории с корректными данными.
 *
 * Предусловия: изолированный профиль предоставляет доступную роль администратора.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает создание категории.
 * 3. Администратор указывает название категории.
 * 4. Администратор указывает описание категории.
 * 5. Администратор сохраняет категорию.
 * 6. Администратор открывает редактирование созданной категории.
 *
 * Ожидаемый результат:
 * - Администратор видит созданную категорию с указанными названием и описанием.
 * - Администратор видит включённый переключатель «Категория активна».
 */
test("CATALOG-02: администратор создаёт активную категорию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Категория ${testInfo.testId}`;
  const description = `Описание ${testInfo.testId}`;

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.categoryEditor.startCreation();
  await menuManagement.categoryEditor.fillName(categoryName);
  await menuManagement.categoryEditor.fillDescription(description);
  await menuManagement.categoryEditor.save(categoryName);
  await menuManagement.categoryEditor.openForEditing(categoryName);

  await test.step("Администратор видит созданную категорию с указанными названием и описанием.", async () => {
    expect(
      await menuManagement.categoryEditor.readName(),
      "Название созданной категории сохранено.",
    ).toBe(categoryName);
    expect(
      await menuManagement.categoryEditor.readDescription(),
      "Описание созданной категории сохранено.",
    ).toBe(description);
  });
  await test.step("Администратор видит включённый переключатель «Категория активна».", async () => {
    expect(
      await menuManagement.categoryEditor.isActive(),
      "Переключатель «Категория активна» включён.",
    ).toBe(true);
  });
});
