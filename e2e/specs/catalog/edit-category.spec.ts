import { expectedResult, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение данных существующей категории.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора и категорию «Кофе».
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает редактирование категории «Кофе».
 * 3. Администратор изменяет название категории на «Кофе — обновлено».
 * 4. Администратор изменяет описание категории на «Обновлённое описание
 *    категории кофе.».
 * 5. Администратор сохраняет изменения.
 * 6. Администратор открывает редактирование категории «Кофе — обновлено».
 *
 * Ожидаемый результат:
 * - Администратор видит категорию «Кофе — обновлено» с описанием
 *   «Обновлённое описание категории кофе.».
 */
test("CATALOG-04: администратор редактирует категорию", async ({
  page,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const initialName = "Кофе";
  const categoryName = "Кофе — обновлено";
  const description = "Обновлённое описание категории кофе.";

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.categoryEditor.openForEditing(initialName);
  await menuManagement.categoryEditor.fillName(categoryName);
  await menuManagement.categoryEditor.fillDescription(description);
  await menuManagement.categoryEditor.saveChanges(categoryName);
  await menuManagement.categoryEditor.openForEditing(categoryName);

  await expectedResult(
    "Администратор видит категорию «Кофе — обновлено» с описанием «Обновлённое описание категории кофе.».",
    page,
    async () => {
      expect(
        await menuManagement.categoryEditor.readName(),
        "Название категории «Кофе — обновлено» сохранено.",
      ).toBe(categoryName);
      expect(
        await menuManagement.categoryEditor.readDescription(),
        "Описание категории «Обновлённое описание категории кофе.» сохранено.",
      ).toBe(description);
    },
  );
});
