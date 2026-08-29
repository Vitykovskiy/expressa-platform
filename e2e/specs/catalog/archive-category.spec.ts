import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить отмену и подтверждение архивирования категории.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора и активную категорию «Выпечка».
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает редактирование категории «Выпечка».
 * 3. Администратор запрашивает архивирование категории «Выпечка».
 * 4. Администратор отменяет архивирование категории «Выпечка».
 * 5. Администратор повторно запрашивает архивирование категории «Выпечка».
 * 6. Администратор подтверждает архивирование категории «Выпечка».
 *
 * Ожидаемый результат:
 * - После отмены категория остаётся в каталоге.
 * - После подтверждения категория отсутствует среди активных категорий.
 */
test("CATALOG-06: администратор архивирует категорию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const categoryName = "Выпечка";

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.categoryEditor.openForEditing(categoryName);
  await menuManagement.categoryEditor.requestArchive(categoryName);
  await menuManagement.categoryEditor.cancelArchive(categoryName);
  await test.step("После отмены категория остаётся в каталоге.", async () => {
    expect(
      await menuManagement.catalog.hasCategory(categoryName),
      "После отмены категория остаётся в активном каталоге.",
    ).toBe(true);
  });
  await menuManagement.categoryEditor.requestArchive(categoryName);
  await menuManagement.categoryEditor.confirmArchive(categoryName);
  await test.step("После подтверждения категория отсутствует среди активных категорий.", async () => {
    expect(
      await menuManagement.catalog.hasCategory(categoryName),
      "После подтверждения категория отсутствует среди активных категорий.",
    ).toBe(false);
  });
});
