import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение порядка вариантов добавок в группе.
 *
 * Предусловия: администратор авторизован; в группе добавок есть два варианта в известном порядке.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает редактирование группы добавок.
 * 3. Администратор перемещает второй вариант вверх.
 * 4. Администратор сохраняет группу.
 *
 * Ожидаемый результат:
 * - Администратор видит второй вариант перед первым в группе добавок.
 * - Для первого варианта действие перемещения вверх недоступно.
 */
test("CATALOG-14: администратор меняет порядок вариантов добавок", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const groupName = `E2E Порядок добавок ${testInfo.testId}`;
  const firstOptionName = `E2E Первый вариант ${testInfo.testId}`;
  const secondOptionName = `E2E Второй вариант ${testInfo.testId}`;
  let primaryError: unknown;
  let hasPrimaryFailure = false;
  let cleanupError: unknown;
  let hasCleanupFailure = false;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);

  try {
    await test.step("Подготовка: администратор создаёт группу добавок с двумя вариантами.", async () => {
      await menuManagement.open();
      await menuManagement.modifierGroupEditor.startCreation();
      await menuManagement.modifierGroupEditor.fillName(groupName);
      await menuManagement.modifierGroupEditor.addOption();
      await menuManagement.modifierGroupEditor.fillOptionName(firstOptionName);
      await menuManagement.modifierGroupEditor.setOptionPrice("0");
      await menuManagement.modifierGroupEditor.addOption();
      await menuManagement.modifierGroupEditor.fillOptionName(secondOptionName);
      await menuManagement.modifierGroupEditor.setOptionPrice("0");
      await menuManagement.modifierGroupEditor.save();
    });

    await menuManagement.open();
    await menuManagement.modifierGroupEditor.openForEditing(groupName);
    await menuManagement.modifierGroupEditor.moveOptionUp(secondOptionName);
    await menuManagement.modifierGroupEditor.save();
    await menuManagement.modifierGroupEditor.openForEditing(groupName);

    await test.step("Администратор видит второй вариант перед первым в группе добавок.", async () => {
      expect(
        await menuManagement.modifierGroupEditor.readOptionOrder(),
        "Второй вариант показан перед первым в группе добавок.",
      ).toEqual([secondOptionName, firstOptionName]);
    });
    await test.step("Для первого варианта действие перемещения вверх недоступно.", async () => {
      expect(
        await menuManagement.modifierGroupEditor.isOptionMoveUpAvailable(
          secondOptionName,
        ),
        "Для первого варианта действие перемещения вверх недоступно.",
      ).toBe(false);
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
