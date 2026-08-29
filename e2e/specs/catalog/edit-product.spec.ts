import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение данных существующего товара.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора и товар «Эспрессо» в категории «Кофе».
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор раскрывает категорию «Кофе».
 * 3. Администратор открывает редактирование товара «Эспрессо».
 * 4. Администратор изменяет название товара на «Эспрессо — обновлено».
 * 5. Администратор сохраняет изменения.
 *
 * Ожидаемый результат:
 * - Администратор видит товар «Эспрессо — обновлено».
 */
test("CATALOG-10: администратор редактирует товар", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const initialProductName = "Эспрессо";
  const productName = "Эспрессо — обновлено";

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.catalog.expandCategory("Кофе");
  await menuManagement.productEditor.openForEditing(initialProductName);
  await menuManagement.productEditor.fillName(productName);
  await menuManagement.productEditor.saveChanges(productName);

  await test.step("Администратор видит товар «Эспрессо — обновлено».", async () => {
    expect(
      await menuManagement.catalog.isProductVisible(productName),
      "Товар «Эспрессо — обновлено» показан в исходной категории.",
    ).toBe(true);
  });
});
