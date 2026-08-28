import {
  createProductOrderScenarioData,
  expect,
  ModifierSelectionType,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer полностью повторяет выданный заказ с пустой корзиной.
 *
 * Предусловия: customer авторизован; у него есть выданный заказ с доступной прежней конфигурацией; корзина пуста.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer открывает выданный заказ.
 * 3. Customer нажимает «Повторить заказ».
 *
 * Ожидаемый результат:
 * - Customer видит открывшуюся корзину.
 * - Корзина содержит все доступные позиции прежнего заказа с прежними количеством, размером и добавками.
 * - Корзина показывает актуальные цены позиций и итоговую сумму.
 */
test("ORDER-06: customer повторяет полностью доступный выданный заказ", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  orderHistory,
  publicMenu,
  staffOrders,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  try {
    const snapshot =
      await test.step("Подготовка: administrator публикует напиток с обязательной добавкой, customer оформляет и staff выдаёт заказ.", async () => {
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
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          data.productPrice,
        );
        await menuManagement.productEditor.save(data.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          data.modifierGroupName,
        );
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
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(data.categoryName);
        await publicMenu.product.openProduct(data);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(data.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(data.productName, data.productQuantity);
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(data.customerName);
        await checkout.cart.placeOrder();
        const order = await customerOrder.details.readSnapshot();
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.staff);
        await staffOrders.queue.waitReady();
        await staffOrders.queue.openDetails(order);
        await staffOrders.queue.transition(
          order,
          OrderQueueTransitionAction.ACCEPT,
        );
        await staffOrders.queue.transition(
          order,
          OrderQueueTransitionAction.START_PREPARING,
        );
        await staffOrders.queue.transition(
          order,
          OrderQueueTransitionAction.MARK_READY,
        );
        await staffOrders.queue.transition(
          order,
          OrderQueueTransitionAction.ISSUE,
        );
        await backOfficeAuth.form.signOut();

        return order;
      });

    await test.step("Подготовка: customer авторизуется для просмотра истории.", async () => {
      await customerAuth.open(e2eEnvironment.frontOfficeUrl);
      await customerAuth.phoneVerification.fillPhone(
        e2eCredentials.customer.phone,
      );
      await customerAuth.phoneVerification.requestCode();
      await customerAuth.phoneVerification.fillCode(
        e2eCredentials.customer.otp,
      );
      await customerAuth.phoneVerification.confirm();
      await customerAuth.profile.completeProfileIfShown(data.customerName);
    });
    await orderHistory.open();
    await orderHistory.history.openOrder(snapshot);
    await customerOrder.details.repeatOrder();

    await test.step("Customer видит открывшуюся корзину.", async () => {
      expect(await checkout.isCartOpen(), "Корзина открыта.").toBe(true);
    });
    await test.step("Корзина содержит все доступные позиции прежнего заказа с прежними количеством, размером и добавками.", async () => {
      expect(
        await checkout.cart.readItemName(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        "Повторённая позиция имеет исходное наименование.",
      ).toBe(data.productName);
      expect(
        await checkout.cart.readItemVariant(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        "Повторённая позиция имеет исходный размер.",
      ).toBe("Размер M");
      expect(
        await checkout.cart.readItemModifiers(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        "Повторённая позиция имеет исходную добавку.",
      ).toEqual([`+ ${data.modifierName}`]);
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        "Повторённая позиция имеет исходное количество.",
      ).toBe(data.productQuantity);
    });
    await test.step("Корзина показывает актуальные цены позиций и итоговую сумму.", async () => {
      const lineTotal = await checkout.cart.readItemLineTotal(
        data.productName,
        ProductConfiguratorSize.M,
        [data.modifierName],
      );

      expect(lineTotal, "Цена повторённой позиции актуальна.").toBe(
        snapshot.lineTotal,
      );
      expect(
        await checkout.cart.readTotal(),
        "Итог корзины соответствует актуальной цене повторённой позиции.",
      ).toBe(lineTotal);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные данные каталога.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(data.productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        data.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
