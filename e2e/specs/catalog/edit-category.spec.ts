import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение данных существующей категории.
 *
 * Предусловия: administrator авторизован; в каталоге есть категория.
 *
 * Сценарий:
 * 1. Administrator открывает управление меню.
 * 2. Administrator открывает редактирование категории.
 * 3. Administrator изменяет название категории.
 * 4. Administrator изменяет описание категории.
 * 5. Administrator сохраняет изменения.
 * 6. Administrator открывает редактирование категории.
 *
 * Ожидаемый результат:
 * - Administrator видит категорию с новыми названием и описанием.
 */
test("CATALOG-04: administrator редактирует категорию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const initialName = `E2E Исходная ${testInfo.testId}`;
  const categoryName = `E2E Изменённая ${testInfo.testId}`;
  const description = `Новое описание ${testInfo.testId}`;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();
  try {
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(initialName);
    await menuManagement.categoryEditor.fillDescription("Исходное описание");
    await menuManagement.categoryEditor.save(initialName);

    await menuManagement.open();
    await menuManagement.categoryEditor.openForEditing(initialName);
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription(description);
    await menuManagement.categoryEditor.saveChanges(categoryName);
    await menuManagement.categoryEditor.openForEditing(categoryName);

    await test.step("Administrator видит категорию с новыми названием и описанием.", async () => {
      expect(
        await menuManagement.categoryEditor.readName(),
        "Новое название категории сохранено.",
      ).toBe(categoryName);
      expect(
        await menuManagement.categoryEditor.readDescription(),
        "Новое описание категории сохранено.",
      ).toBe(description);
    });
  } finally {
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await menuManagement.categoryEditor.archiveIfPresent(initialName);
    await backOfficeAuth.form.signOut();
  }
});
