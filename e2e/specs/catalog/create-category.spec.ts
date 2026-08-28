import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить создание активной категории с корректными данными.
 *
 * Предусловия: administrator авторизован; категории с выбранным названием нет.
 *
 * Сценарий:
 * 1. Administrator нажимает «Добавить группу».
 * 2. Administrator указывает название категории.
 * 3. Administrator указывает описание категории.
 * 4. Administrator сохраняет категорию.
 * 5. Administrator открывает редактирование созданной категории.
 *
 * Ожидаемый результат:
 * - Administrator видит созданную категорию с указанными названием и описанием.
 * - Administrator видит включённый переключатель «Категория активна».
 */
test("CATALOG-02: administrator создаёт активную категорию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Категория ${testInfo.testId}`;
  const description = `Описание ${testInfo.testId}`;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();

  try {
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription(description);
    await menuManagement.categoryEditor.save(categoryName);
    await menuManagement.categoryEditor.openForEditing(categoryName);

    await test.step("Administrator видит созданную категорию с указанными названием и описанием.", async () => {
      expect(
        await menuManagement.categoryEditor.readName(),
        "Название созданной категории сохранено.",
      ).toBe(categoryName);
      expect(
        await menuManagement.categoryEditor.readDescription(),
        "Описание созданной категории сохранено.",
      ).toBe(description);
    });
    await test.step("Administrator видит включённый переключатель «Категория активна».", async () => {
      expect(
        await menuManagement.categoryEditor.isActive(),
        "Переключатель «Категория активна» включён.",
      ).toBe(true);
    });
  } finally {
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
