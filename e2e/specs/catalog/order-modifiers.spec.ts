import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение порядка вариантов добавок в группе.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора и группу «Молоко» с вариантами «Обычное молоко» и «Овсяное
 * молоко» в этом порядке.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает редактирование группы «Молоко».
 * 3. Администратор перемещает вариант «Овсяное молоко» вверх.
 * 4. Администратор сохраняет группу.
 * 5. Администратор открывает редактирование группы «Молоко».
 *
 * Ожидаемый результат:
 * - Администратор видит вариант «Овсяное молоко» перед вариантом «Обычное
 *   молоко» в группе добавок.
 * - Для варианта «Овсяное молоко» действие перемещения вверх недоступно.
 */
test("CATALOG-14: администратор меняет порядок вариантов добавок", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const groupName = "Молоко";
  const firstOptionName = "Обычное молоко";
  const secondOptionName = "Овсяное молоко";
  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.modifierGroupEditor.openForEditing(groupName);
  await menuManagement.modifierGroupEditor.moveOptionUp(secondOptionName);
  await menuManagement.modifierGroupEditor.save();
  await menuManagement.modifierGroupEditor.openForEditing(groupName);
  await test.step("Администратор видит вариант «Овсяное молоко» перед вариантом «Обычное молоко» в группе добавок.", async () => {
    expect(
      await menuManagement.modifierGroupEditor.readOptionOrder(),
      "Вариант «Овсяное молоко» показан перед вариантом «Обычное молоко».",
    ).toEqual([secondOptionName, firstOptionName]);
  });
  await test.step("Для варианта «Овсяное молоко» действие перемещения вверх недоступно.", async () => {
    expect(
      await menuManagement.modifierGroupEditor.isOptionMoveUpAvailable(
        secondOptionName,
      ),
      "Для варианта «Овсяное молоко» действие перемещения вверх недоступно.",
    ).toBe(false);
  });
});
