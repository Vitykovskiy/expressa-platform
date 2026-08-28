import { ModifierSelectionType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить создание обязательной группы добавок с вариантом по умолчанию.
 *
 * Предусловия: администратор авторизован.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор нажимает «Новая группа опций».
 * 3. Администратор указывает название группы.
 * 4. Администратор включает обязательность группы.
 * 5. Администратор выбирает одиночный тип выбора.
 * 6. Администратор добавляет вариант.
 * 7. Администратор указывает название варианта.
 * 8. Администратор указывает нулевое изменение цены.
 * 9. Администратор включает выбор варианта по умолчанию.
 * 10. Администратор сохраняет группу.
 *
 * Ожидаемый результат:
 * - Администратор видит созданную группу добавок.
 * - Администратор видит созданный бесплатный вариант, выбранный по умолчанию.
 */
test("CATALOG-13: администратор создаёт группу добавок с вариантом по умолчанию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const groupName = `E2E Добавки ${testInfo.testId}`;
  const optionName = `E2E Вариант ${testInfo.testId}`;
  let primaryError: unknown;
  let hasPrimaryFailure = false;
  let cleanupError: unknown;
  let hasCleanupFailure = false;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);

  try {
    await menuManagement.open();
    await menuManagement.modifierGroupEditor.startCreation();
    await menuManagement.modifierGroupEditor.fillName(groupName);
    await menuManagement.modifierGroupEditor.setRequired();
    await menuManagement.modifierGroupEditor.selectType(
      ModifierSelectionType.SINGLE,
    );
    await menuManagement.modifierGroupEditor.addOption();
    await menuManagement.modifierGroupEditor.fillOptionName(optionName);
    await menuManagement.modifierGroupEditor.setOptionPrice("0");
    await menuManagement.modifierGroupEditor.setOptionDefault();
    await menuManagement.modifierGroupEditor.save();

    await test.step("Администратор видит созданную группу добавок.", async () => {
      expect(
        await menuManagement.modifierGroupEditor.isGroupVisible(groupName),
        "Созданная группа добавок показана в управлении меню.",
      ).toBe(true);
    });

    await menuManagement.modifierGroupEditor.openForEditing(groupName);
    await test.step("Администратор видит созданный бесплатный вариант, выбранный по умолчанию.", async () => {
      expect(
        await menuManagement.modifierGroupEditor.isOptionFree(optionName),
        "У созданного варианта указано нулевое изменение цены.",
      ).toBe(true);
      expect(
        await menuManagement.modifierGroupEditor.isOptionDefault(optionName),
        "Созданный вариант выбран по умолчанию.",
      ).toBe(true);
    });
  } catch (error) {
    primaryError = error;
    hasPrimaryFailure = true;
  } finally {
    try {
      await menuManagement.modifierGroupEditor.cancelEditing(groupName);
    } catch (error) {
      if (!hasCleanupFailure) {
        cleanupError = error;
        hasCleanupFailure = true;
      }
    }
    try {
      await menuManagement.modifierGroupEditor.archiveIfPresent(groupName);
    } catch (error) {
      if (!hasCleanupFailure) {
        cleanupError = error;
        hasCleanupFailure = true;
      }
    }
    try {
      await backOfficeAuth.form.signOut();
    } catch (error) {
      if (!hasCleanupFailure) {
        cleanupError = error;
        hasCleanupFailure = true;
      }
    }
  }

  if (hasPrimaryFailure) throw primaryError;
  if (hasCleanupFailure) throw cleanupError;
});
