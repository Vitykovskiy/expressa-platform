import { expectedResult, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение порядка категорий в каталоге.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора и категории «Кофе» и «Выпечка» в этом порядке.
 *
 * Сценарий:
 * 1. Администратор открывает раздел «Меню».
 * 2. Администратор открывает управление меню.
 * 3. Администратор перемещает категорию «Выпечка» вверх.
 *
 * Ожидаемый результат:
 * - Администратор видит категорию «Выпечка» перед категорией «Кофе».
 * - Для категории «Выпечка» действие перемещения вверх недоступно.
 */
test("CATALOG-05: администратор меняет порядок категорий", async ({
  page,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const firstCategoryName = "Кофе";
  const secondCategoryName = "Выпечка";

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.ensureManagementExpanded();
  await menuManagement.catalog.moveCategoryUp(secondCategoryName);

  await expectedResult(
    "Администратор видит категорию «Выпечка» перед категорией «Кофе».",
    page,
    async () => {
      const categoryOrder = await menuManagement.catalog.readCategoryOrder();

      expect(
        categoryOrder.indexOf(secondCategoryName),
        "Категория «Выпечка» показана в каталоге.",
      ).toBeGreaterThanOrEqual(0);
      expect(
        categoryOrder.indexOf(secondCategoryName),
        "Категория «Выпечка» показана перед категорией «Кофе».",
      ).toBeLessThan(categoryOrder.indexOf(firstCategoryName));
    },
  );
  await expectedResult(
    "Для категории «Выпечка» действие перемещения вверх недоступно.",
    page,
    async () => {
      expect(
        await menuManagement.catalog.isCategoryMoveUpAvailable(
          secondCategoryName,
        ),
        "Для категории «Выпечка» действие перемещения вверх недоступно.",
      ).toBe(false);
    },
  );
});
