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
 * Назначение: customer повторяет доступную часть выданного заказа.
 *
 * Предусловия: customer авторизован; у него есть выданный заказ с доступной и недоступной в прежней конфигурации позициями; корзина пуста.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer открывает выданный заказ.
 * 3. Customer нажимает «Повторить заказ».
 *
 * Ожидаемый результат:
 * - Customer видит открывшуюся корзину с доступными позициями.
 * - Доступные позиции сохранены с прежними количеством, размером и добавками.
 * - Customer видит имя недоступной позиции и причину, по которой она не добавлена.
 */
test("ORDER-07: customer повторяет доступную часть выданного заказа", async ({
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
  const available = createProductOrderScenarioData(testInfo.testId);
  const unavailable = createProductOrderScenarioData(testInfo.testId);

  try {
    const order =
      await test.step("Подготовка: administrator публикует два напитка, customer оформляет заказ, staff выдаёт его, administrator архивирует один напиток.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.categoryEditor.startCreation();
        await menuManagement.categoryEditor.fillName(available.categoryName);
        await menuManagement.categoryEditor.fillDescription(
          available.productDescription,
        );
        await menuManagement.categoryEditor.save(available.categoryName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          available.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(available.productName);
        await menuManagement.productEditor.fillDescription(
          available.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          available.productPrice,
        );
        await menuManagement.productEditor.save(available.productName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          available.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(unavailable.productName);
        await menuManagement.productEditor.fillDescription(
          unavailable.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          unavailable.productPrice,
        );
        await menuManagement.productEditor.save(unavailable.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          available.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          available.modifierName,
        );
        await menuManagement.modifierGroupEditor.setOptionPrice("0");
        await menuManagement.modifierGroupEditor.setOptionDefault();
        await menuManagement.modifierGroupEditor.save();
        await menuManagement.assignments.openCategory(available.categoryName);
        await menuManagement.assignments.selectGroup(
          available.modifierGroupName,
        );
        await menuManagement.assignments.save();
        await backOfficeAuth.form.signOut();
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(available.categoryName);
        await publicMenu.product.openProduct(available);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(available.modifierName);
        await publicMenu.product.addToCart();
        await publicMenu.product.openProduct(unavailable);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(available.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(
          available.productName,
          available.productQuantity,
          ProductConfiguratorSize.M,
          [available.modifierName],
        );
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(available.customerName);
        await checkout.cart.placeOrder();
        const reference = await customerOrder.details.readReference();
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.staff);
        await staffOrders.queue.waitReady();
        await staffOrders.queue.openDetails(reference);
        await staffOrders.queue.transition(
          reference,
          OrderQueueTransitionAction.ACCEPT,
        );
        await staffOrders.queue.transition(
          reference,
          OrderQueueTransitionAction.START_PREPARING,
        );
        await staffOrders.queue.transition(
          reference,
          OrderQueueTransitionAction.MARK_READY,
        );
        await staffOrders.queue.transition(
          reference,
          OrderQueueTransitionAction.ISSUE,
        );
        await backOfficeAuth.form.signOut();
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.catalog.expandCategoryIfPresent(
          available.categoryName,
        );
        await menuManagement.productEditor.delete(unavailable.productName);
        await backOfficeAuth.form.signOut();

        return reference;
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
      await customerAuth.profile.completeProfileIfShown(available.customerName);
    });
    await orderHistory.open();
    await orderHistory.history.openOrder(order);
    await customerOrder.details.repeatOrder();

    await test.step("Customer видит открывшуюся корзину с доступными позициями.", async () => {
      expect(await checkout.isCartOpen(), "Корзина открыта.").toBe(true);
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине показана только доступная позиция.",
      ).toBe(1);
    });
    await test.step("Доступные позиции сохранены с прежними количеством, размером и добавками.", async () => {
      expect(
        await checkout.cart.readItemName(
          available.productName,
          ProductConfiguratorSize.M,
          [available.modifierName],
        ),
        "Доступная позиция имеет исходное наименование.",
      ).toBe(available.productName);
      expect(
        await checkout.cart.readItemVariant(
          available.productName,
          ProductConfiguratorSize.M,
          [available.modifierName],
        ),
        "Доступная позиция имеет исходный размер.",
      ).toBe("Размер M");
      expect(
        await checkout.cart.readItemModifiers(
          available.productName,
          ProductConfiguratorSize.M,
          [available.modifierName],
        ),
        "Доступная позиция имеет исходную добавку.",
      ).toEqual([`+ ${available.modifierName}`]);
      expect(
        await checkout.cart.readItemQuantity(
          available.productName,
          ProductConfiguratorSize.M,
          [available.modifierName],
        ),
        "Доступная позиция имеет исходное количество.",
      ).toBe(available.productQuantity);
    });
    await test.step("Customer видит имя недоступной позиции и причину, по которой она не добавлена.", async () => {
      expect(
        await customerOrder.details.readRepeatUnavailableProductNames(),
        "Показано имя недоступной позиции.",
      ).toContain(unavailable.productName);
      expect(
        await customerOrder.details.readRepeatUnavailableReason(
          unavailable.productName,
        ),
        "Показана причина непереноса недоступной позиции.",
      ).not.toBe("");
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные данные каталога.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(
        available.categoryName,
      );
      await menuManagement.productEditor.deleteIfPresent(available.productName);
      await menuManagement.productEditor.deleteIfPresent(
        unavailable.productName,
      );
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        available.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(
        available.categoryName,
      );
      await backOfficeAuth.form.signOut();
    });
  }
});
