import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить отмену и подтверждение архивирования товара.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора и активный товар «Круассан».
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает редактирование товара «Круассан».
 * 3. Администратор запрашивает удаление товара «Круассан».
 * 4. Администратор отменяет удаление товара «Круассан».
 * 5. Администратор повторно запрашивает удаление товара «Круассан».
 * 6. Администратор подтверждает удаление товара «Круассан».
 *
 * Ожидаемый результат:
 * - После отмены товар остаётся в категории.
 * - После подтверждения товар отсутствует среди активных товаров.
 */
test("CATALOG-12: администратор архивирует товар", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const productName = "Круассан";

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.productEditor.openForEditing(productName);
  await menuManagement.productEditor.requestArchive(productName);
  await menuManagement.productEditor.cancelArchive(productName);
  await test.step("После отмены товар остаётся в категории.", async () => {
    expect(
      await menuManagement.catalog.isProductVisible(productName),
      "После отмены товар остаётся в активной категории.",
    ).toBe(true);
  });
  await menuManagement.productEditor.requestArchive(productName);
  await menuManagement.productEditor.confirmArchive(productName);
  await test.step("После подтверждения товар отсутствует среди активных товаров.", async () => {
    expect(
      await menuManagement.catalog.isProductAbsent(productName),
      "После подтверждения товар отсутствует среди активных товаров.",
    ).toBe(true);
  });
});
