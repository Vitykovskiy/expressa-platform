import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить назначение существующей группы добавок категории и валидацию порядка.
 *
 * Предусловия: администратор авторизован; в каталоге есть категория и не назначенная ей группа добавок.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор выбирает категорию для настройки добавок.
 * 3. Администратор назначает существующую группу добавок.
 * 4. Администратор указывает отрицательный порядок группы.
 * 5. Администратор указывает неотрицательный порядок группы.
 * 6. Администратор сохраняет назначения.
 *
 * Ожидаемый результат:
 * - Администратор видит сообщение о необходимости указать неотрицательный порядок.
 * - После исправления Администратор видит назначенную группе добавок категорию и её порядок.
 */
test("CATALOG-15: администратор назначает группе добавок категорию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Категория добавок ${testInfo.testId}`;
  const groupName = `E2E Группа добавок ${testInfo.testId}`;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);

  try {
    await test.step("Подготовка: администратор создаёт категорию и группу добавок.", async () => {
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription("Категория добавок");
      await menuManagement.categoryEditor.save(categoryName);
      await menuManagement.modifierGroupEditor.startCreation();
      await menuManagement.modifierGroupEditor.fillName(groupName);
      await menuManagement.modifierGroupEditor.save();
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

    await test.step("После исправления Администратор видит назначенную группе добавок категорию и её порядок.", async () => {
      expect(
        await menuManagement.assignments.isGroupAssigned(groupName),
        "Группа добавок назначена выбранной категории.",
      ).toBe(true);
      expect(
        await menuManagement.assignments.readOrder(),
        "Для назначенной группы добавок сохранён указанный порядок.",
      ).toBe("0");
    });
  } finally {
    await menuManagement.modifierGroupEditor.archiveIfPresent(groupName);
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
