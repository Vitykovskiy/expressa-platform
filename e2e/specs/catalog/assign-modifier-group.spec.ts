import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить назначение группы добавок категории и валидацию порядка.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора, категорию «Выпечка» и не назначенную ей группу «Молоко».
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает назначения категории «Выпечка».
 * 3. Администратор назначает группу «Молоко».
 * 4. Администратор указывает порядок группы «-1».
 * 5. Администратор указывает порядок группы «0».
 * 6. Администратор сохраняет назначения.
 *
 * Ожидаемый результат:
 * - Администратор видит сообщение о необходимости указать неотрицательный порядок.
 * - После исправления администратор видит назначенную группе добавок категорию и её порядок.
 */
test("CATALOG-15: администратор назначает группе добавок категорию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const categoryName = "Выпечка";
  const groupName = "Молоко";
  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.assignments.openCategory(categoryName);
  await menuManagement.assignments.selectGroup(groupName);
  await menuManagement.assignments.setOrder("-1");
  await test.step("Администратор видит сообщение о необходимости указать неотрицательный порядок.", async () => {
    expect(
      await menuManagement.assignments.readOrderValidation(),
      "Показано требование указать неотрицательный порядок группы добавок.",
    ).toBe("Укажите неотрицательный порядок для каждой группы");
  });
  await menuManagement.assignments.setOrder("0");
  await menuManagement.assignments.save();
  await test.step("После исправления администратор видит назначенную группе добавок категорию и её порядок.", async () => {
    expect(
      await menuManagement.assignments.isGroupAssigned(groupName),
      "Группа добавок назначена выбранной категории.",
    ).toBe(true);
    expect(
      await menuManagement.assignments.readOrder(),
      "Для назначенной группы добавок сохранён указанный порядок.",
    ).toBe("0");
  });
});
