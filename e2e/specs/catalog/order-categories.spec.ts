import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение порядка категорий в каталоге.
 *
 * Предусловия: administrator авторизован; в каталоге есть две категории в известном порядке.
 *
 * Сценарий:
 * 1. Administrator открывает управление меню.
 * 2. Administrator перемещает вторую категорию вверх.
 *
 * Ожидаемый результат:
 * - Administrator видит вторую категорию перед первой.
 * - Для первой категории действие перемещения вверх недоступно.
 */
test("CATALOG-05: administrator меняет порядок категорий", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const firstCategoryName = `E2E Первая ${testInfo.testId}`;
  const secondCategoryName = `E2E Вторая ${testInfo.testId}`;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();
  try {
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(firstCategoryName);
    await menuManagement.categoryEditor.fillDescription("Первая категория");
    await menuManagement.categoryEditor.save(firstCategoryName);
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(secondCategoryName);
    await menuManagement.categoryEditor.fillDescription("Вторая категория");
    await menuManagement.categoryEditor.save(secondCategoryName);

    await menuManagement.open();
    await menuManagement.ensureManagementExpanded();
    await menuManagement.catalog.moveCategoryUp(secondCategoryName);

    await test.step("Administrator видит вторую категорию перед первой.", async () => {
      expect(
        await menuManagement.catalog.readCategoryOrder(),
        "Категории показаны в изменённом порядке.",
      ).toEqual([secondCategoryName, firstCategoryName]);
    });
    await test.step("Для первой категории действие перемещения вверх недоступно.", async () => {
      expect(
        await menuManagement.catalog.isCategoryMoveUpAvailable(
          secondCategoryName,
        ),
        "Для первой категории действие перемещения вверх недоступно.",
      ).toBe(false);
    });
  } finally {
    await menuManagement.categoryEditor.archiveIfPresent(firstCategoryName);
    await menuManagement.categoryEditor.archiveIfPresent(secondCategoryName);
    await backOfficeAuth.form.signOut();
  }
});
