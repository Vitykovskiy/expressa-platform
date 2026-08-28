import {
  createProductOrderScenarioData,
  expect,
  ModifierSelectionType,
  OrderStatus,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer подтверждает оформление после изменения итога корзины.
 *
 * Предусловия: customer авторизован; в корзине есть капучино размера M с прежней ценой 250 ₽; актуальная цена капучино размера M составляет 300 ₽; приём новых заказов открыт.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer выбирает оформление заказа.
 * 3. Customer подтверждает новый итог 300 ₽.
 *
 * Ожидаемый результат:
 * - Корзина показывает прежний итог 250 ₽ и новый итог 300 ₽.
 * - Customer видит запрос на подтверждение нового итога.
 * - Customer видит страницу созданного заказа с итогом 300 ₽.
 */
test("CHECKOUT-03: customer подтверждает актуальную цену", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const productName = `Капучино ${testInfo.testId}`;
  const formatter = new Intl.NumberFormat("ru-RU", {
    currency: "RUB",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  });

  try {
    await test.step("Подготовка: administrator публикует капучино размера M стоимостью 250 ₽ с обязательной бесплатной добавкой.", async () => {
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
      await menuManagement.productEditor.fillName(productName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
      await menuManagement.productEditor.setPrice(ProductEditorSize.M, "25000");
      await menuManagement.productEditor.save(productName);
      await menuManagement.modifierGroupEditor.openManagement();
      await menuManagement.modifierGroupEditor.startCreation();
      await menuManagement.modifierGroupEditor.fillName(data.modifierGroupName);
      await menuManagement.modifierGroupEditor.setRequired();
      await menuManagement.modifierGroupEditor.selectType(
        ModifierSelectionType.SINGLE,
      );
      await menuManagement.modifierGroupEditor.addOption();
      await menuManagement.modifierGroupEditor.fillOptionName(
        data.modifierName,
      );
      await menuManagement.modifierGroupEditor.setOptionPrice("0");
      await menuManagement.modifierGroupEditor.setOptionDefault();
      await menuManagement.modifierGroupEditor.save();
      await menuManagement.assignments.openCategory(data.categoryName);
      await menuManagement.assignments.selectGroup(data.modifierGroupName);
      await menuManagement.assignments.save();
      await backOfficeAuth.form.signOut();
      await customerAuth.open(e2eEnvironment.frontOfficeUrl);
      await customerAuth.phoneVerification.fillPhone(
        e2eCredentials.customer.phone,
      );
      await customerAuth.phoneVerification.requestCode();
      await customerAuth.phoneVerification.fillCode(
        e2eCredentials.customer.otp,
      );
      await customerAuth.phoneVerification.confirm();
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(data.categoryName);
      await publicMenu.product.openProduct(productName);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
      await publicMenu.product.selectModifier(data.modifierName);
      await publicMenu.product.addToCart();
    });
    await test.step("Подготовка: administrator меняет цену капучино размера M на 300 ₽ через интерфейс управления меню.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.productEditor.openForEditing(productName);
      await menuManagement.productEditor.setPrice(ProductEditorSize.M, "30000");
      await menuManagement.productEditor.saveChanges(productName);
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await checkout.cart.open();
    await checkout.cart.requestUpdatedTotalConfirmation();

    await test.step("Корзина показывает прежний итог 250 ₽ и новый итог 300 ₽.", async () => {
      const totals = await checkout.cart.readUpdatedTotals();

      expect(totals.previousTotal, "Показан прежний итог 250 ₽.").toBe(
        formatter.format(250),
      );
      expect(totals.newTotal, "Показан новый итог 300 ₽.").toBe(
        formatter.format(300),
      );
    });
    await test.step("Customer видит запрос на подтверждение нового итога.", async () => {
      expect(
        await checkout.cart.isUpdatedTotalConfirmationVisible(),
        "Кнопка подтверждения нового итога показана.",
      ).toBe(true);
    });

    await checkout.cart.confirmUpdatedTotal();

    await test.step("Customer видит страницу созданного заказа с итогом 300 ₽.", async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(order.status, "Созданный заказ принят.").toBe(OrderStatus.CREATED);
      expect(order.total, "Итог созданного заказа равен 300 ₽.").toBe(
        formatter.format(300),
      );
    });
  } finally {
    await test.step("Очистка: administrator восстанавливает цену и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.openForEditing(productName);
      await menuManagement.productEditor.setPrice(ProductEditorSize.M, "25000");
      await menuManagement.productEditor.saveChanges(productName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        data.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
