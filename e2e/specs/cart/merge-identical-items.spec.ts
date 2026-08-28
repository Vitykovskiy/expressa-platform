import {
  createProductOrderScenarioData,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: повторное добавление одинаковой конфигурации увеличивает её количество, а не создаёт вторую позицию.
 *
 * Предусловия: в публичном меню есть опубликованный доступный товар; корзина customer пуста.
 *
 * Сценарий:
 * 1. Customer открывает товар в публичном меню.
 * 2. Customer добавляет товар с исходной конфигурацией в корзину.
 * 3. Customer снова добавляет товар с той же конфигурацией в корзину.
 * 4. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - В корзине показана одна позиция товара.
 * - Количество позиции равно сумме добавлений.
 * - Стоимость позиции и итог корзины соответствуют её новому количеству.
 */
test("CART-02: customer объединяет одинаковые конфигурации", async ({
  backOfficeAuth,
  checkout,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const rubleFormatter = new Intl.NumberFormat("ru-RU", {
    currency: "RUB",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  });
  try {
    await test.step("Подготовка: administrator публикует доступный напиток.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(data.categoryName);
      await menuManagement.categoryEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.categoryEditor.save(data.categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(data.categoryName);
      await menuManagement.productEditor.selectType(ProductType.DRINK);
      await menuManagement.productEditor.fillName(data.productName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.S,
        data.productPrice,
      );
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.M,
        data.productPrice,
      );
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.L,
        data.productPrice,
      );
      await menuManagement.productEditor.save(data.productName);
      await backOfficeAuth.form.signOut();
    });
    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(data.categoryName);
    await publicMenu.product.openProduct(data.productName);
    await publicMenu.product.addToCart();
    await publicMenu.product.openProduct(data.productName);
    await publicMenu.product.addToCart();
    await checkout.cart.open();
    await test.step("В корзине показана одна позиция товара.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине показана одна позиция товара.",
      ).toBe(1);
    });
    await test.step("Количество позиции равно сумме добавлений.", async () => {
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Количество позиции равно двум.",
      ).toBe(2);
    });
    await test.step("Стоимость позиции и итог корзины соответствуют её новому количеству.", async () => {
      const expectedLineTotal = rubleFormatter.format(
        (Number(data.productPrice) * 2) / 100,
      );
      const lineTotal = await checkout.cart.readItemLineTotal(
        data.productName,
        ProductConfiguratorSize.M,
        [],
      );
      expect(
        lineTotal,
        "Стоимость позиции соответствует новому количеству.",
      ).toBe(expectedLineTotal);
      expect(
        await checkout.cart.readTotal(),
        "Итог корзины соответствует стоимости позиции.",
      ).toBe(expectedLineTotal);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные категорию и товар.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(data.productName);
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
