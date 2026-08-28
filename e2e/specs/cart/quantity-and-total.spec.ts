import {
  createProductOrderScenarioData,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer изменяет количество позиции, а корзина пересчитывает её стоимость и общий итог.
 *
 * Предусловия: в корзине customer есть одна доступная позиция с известной стоимостью и количеством один.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer увеличивает количество позиции до двух.
 * 3. Customer уменьшает количество позиции до одного.
 * 4. Customer увеличивает количество позиции до двадцати.
 *
 * Ожидаемый результат:
 * - После каждого изменения показаны новое количество, стоимость позиции и итог корзины.
 * - Стоимость позиции равна цене одной конфигурации, умноженной на количество.
 * - Customer может установить разрешённое по умолчанию количество двадцать.
 */
test("CART-04: customer изменяет количество и итог", async ({
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
    await test.step("Подготовка: administrator публикует напиток, а customer добавляет одну позицию в корзину.", async () => {
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
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(data.categoryName);
      await publicMenu.product.openProduct(data.productName);
      await publicMenu.product.addToCart();
    });
    await checkout.cart.open();
    const unitTotal = rubleFormatter.format(Number(data.productPrice) / 100);
    await checkout.cart.setQuantity(
      data.productName,
      2,
      ProductConfiguratorSize.M,
    );
    await test.step("После каждого изменения показаны новое количество, стоимость позиции и итог корзины.", async () => {
      const doubledTotal = rubleFormatter.format(
        (Number(data.productPrice) * 2) / 100,
      );
      const lineTotal = await checkout.cart.readItemLineTotal(
        data.productName,
        ProductConfiguratorSize.M,
        [],
      );
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После увеличения показано количество два.",
      ).toBe(2);
      expect(
        lineTotal,
        "После увеличения показана новая стоимость позиции.",
      ).toBe(doubledTotal);
      expect(
        await checkout.cart.readTotal(),
        "После увеличения показан новый итог корзины.",
      ).toBe(doubledTotal);
    });
    await checkout.cart.setQuantity(
      data.productName,
      1,
      ProductConfiguratorSize.M,
    );
    await test.step("Стоимость позиции равна цене одной конфигурации, умноженной на количество.", async () => {
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После уменьшения показано количество один.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemLineTotal(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Стоимость одной позиции равна цене одной конфигурации.",
      ).toBe(unitTotal);
      expect(
        await checkout.cart.readTotal(),
        "Итог корзины равен стоимости одной позиции.",
      ).toBe(unitTotal);
    });
    await checkout.cart.setQuantity(
      data.productName,
      20,
      ProductConfiguratorSize.M,
    );
    await test.step("Customer может установить разрешённое по умолчанию количество двадцать.", async () => {
      const twentyItemsTotal = rubleFormatter.format(
        (Number(data.productPrice) * 20) / 100,
      );
      const lineTotal = await checkout.cart.readItemLineTotal(
        data.productName,
        ProductConfiguratorSize.M,
        [],
      );
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Customer установил количество двадцать.",
      ).toBe(20);
      expect(
        lineTotal,
        "Стоимость позиции пересчитана для количества двадцать.",
      ).toBe(twentyItemsTotal);
      expect(
        await checkout.cart.readTotal(),
        "Итог корзины соответствует количеству двадцать.",
      ).toBe(twentyItemsTotal);
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
