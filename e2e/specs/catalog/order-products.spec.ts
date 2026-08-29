import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение порядка товаров внутри категории.
 *
 * Предусловия: изолированный профиль `catalog-mutation` предоставляет роль
 * администратора и товары «Капучино» и «Эспрессо» в категории «Кофе» в этом
 * порядке.
 *
 * Сценарий:
 * 1. Администратор открывает раздел «Меню».
 * 2. Администратор открывает управление меню.
 * 3. Администратор раскрывает категорию «Кофе».
 * 4. Администратор перемещает товар «Эспрессо» вверх.
 *
 * Ожидаемый результат:
 * - Администратор видит товар «Эспрессо» перед товаром «Капучино» в категории
 *   «Кофе».
 * - Для товара «Эспрессо» действие перемещения вверх недоступно.
 */
test("CATALOG-11: администратор меняет порядок товаров", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  const categoryName = "Кофе";
  const firstProductName = "Капучино";
  const secondProductName = "Эспрессо";
  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.ensureManagementExpanded();
  await menuManagement.catalog.expandCategory(categoryName);
  await menuManagement.catalog.moveProductUp(secondProductName);
  await test.step("Администратор видит товар «Эспрессо» перед товаром «Капучино» в категории «Кофе».", async () => {
    const productOrder = await menuManagement.catalog.readProductOrder();

    expect(
      productOrder.indexOf(secondProductName),
      "Товар «Эспрессо» показан в категории «Кофе».",
    ).toBeGreaterThanOrEqual(0);
    expect(
      productOrder.indexOf(secondProductName),
      "Товар «Эспрессо» показан перед товаром «Капучино».",
    ).toBeLessThan(productOrder.indexOf(firstProductName));
  });
  await test.step("Для товара «Эспрессо» действие перемещения вверх недоступно.", async () => {
    expect(
      await menuManagement.catalog.isProductMoveUpAvailable(secondProductName),
      "Для товара «Эспрессо» действие перемещения вверх недоступно.",
    ).toBe(false);
  });
});
