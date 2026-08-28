import {
  expect,
  ModifierSelectionType,
  OrderQueueFilter,
  OrderQueueStage,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  QueueScenarioFilter,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: сотрудник ограничивает очередь заказами выбранной стадии.
 *
 * Предусловия: barista или administrator вошёл в back-office; в очереди есть заказы на стадиях «Оформлен» и «Готовится».
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник выбирает фильтр «Оформлен».
 * 3. Сотрудник выбирает фильтр «Готовятся».
 * 4. Сотрудник выбирает фильтр «Все».
 *
 * Ожидаемый результат:
 * - После выбора «Оформлен» показаны только оформленные заказы.
 * - После выбора «Готовятся» показаны только готовящиеся заказы.
 * - После выбора «Все» показаны все подготовленные заказы.
 */
test("QUEUE-03: сотрудник фильтрует очередь по стадии", async ({
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
  staffOrders,
}, testInfo) => {
  const createdData = createProductOrderScenarioData(
    `${testInfo.testId}-created`,
  );
  const preparingData = createProductOrderScenarioData(
    `${testInfo.testId}-preparing`,
  );
  try {
    const createdOrder =
      await test.step("Подготовка: administrator публикует первый товар, customer оформляет первый заказ.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.categoryEditor.startCreation();
        await menuManagement.categoryEditor.fillName(createdData.categoryName);
        await menuManagement.categoryEditor.fillDescription(
          createdData.productDescription,
        );
        await menuManagement.categoryEditor.save(createdData.categoryName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          createdData.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(createdData.productName);
        await menuManagement.productEditor.fillDescription(
          createdData.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          createdData.productPrice,
        );
        await menuManagement.productEditor.save(createdData.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          createdData.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          createdData.modifierName,
        );
        await menuManagement.modifierGroupEditor.setOptionPrice("0");
        await menuManagement.modifierGroupEditor.setOptionDefault();
        await menuManagement.modifierGroupEditor.save();
        await menuManagement.assignments.openCategory(createdData.categoryName);
        await menuManagement.assignments.selectGroup(
          createdData.modifierGroupName,
        );
        await menuManagement.assignments.save();
        await backOfficeAuth.form.signOut();
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(createdData.categoryName);
        await publicMenu.product.openProduct(createdData);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(createdData.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(
          createdData.productName,
          createdData.productQuantity,
        );
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(createdData.customerName);
        await checkout.cart.placeOrder();
        return customerOrder.details.readSnapshot();
      });
    const preparingOrder =
      await test.step("Подготовка: administrator публикует второй товар, customer оформляет второй заказ.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.categoryEditor.startCreation();
        await menuManagement.categoryEditor.fillName(
          preparingData.categoryName,
        );
        await menuManagement.categoryEditor.fillDescription(
          preparingData.productDescription,
        );
        await menuManagement.categoryEditor.save(preparingData.categoryName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          preparingData.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(preparingData.productName);
        await menuManagement.productEditor.fillDescription(
          preparingData.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          preparingData.productPrice,
        );
        await menuManagement.productEditor.save(preparingData.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          preparingData.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          preparingData.modifierName,
        );
        await menuManagement.modifierGroupEditor.setOptionPrice("0");
        await menuManagement.modifierGroupEditor.setOptionDefault();
        await menuManagement.modifierGroupEditor.save();
        await menuManagement.assignments.openCategory(
          preparingData.categoryName,
        );
        await menuManagement.assignments.selectGroup(
          preparingData.modifierGroupName,
        );
        await menuManagement.assignments.save();
        await backOfficeAuth.form.signOut();
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(preparingData.categoryName);
        await publicMenu.product.openProduct(preparingData);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(preparingData.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(
          preparingData.productName,
          preparingData.productQuantity,
        );
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(
          preparingData.customerName,
        );
        await checkout.cart.placeOrder();
        return customerOrder.details.readSnapshot();
      });
    await test.step("Подготовка: staff входит в back-office и переводит второй заказ в приготовление.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.staff);
      await staffOrders.open();
      await staffOrders.queue.openDetails(preparingOrder);
      await staffOrders.queue.transition(
        preparingOrder,
        OrderQueueTransitionAction.ACCEPT,
      );
      await staffOrders.queue.transition(
        preparingOrder,
        OrderQueueTransitionAction.START_PREPARING,
      );
    });
    await staffOrders.queue.selectFilter(QueueScenarioFilter.CREATED);
    await test.step("После выбора «Оформлен» показаны только оформленные заказы.", async () => {
      expect(
        await staffOrders.queue.readCurrentStage(createdOrder),
        "Показан оформленный заказ.",
      ).toBe(OrderQueueStage.CREATED);
      await staffOrders.queue.assertOrderHidden(preparingOrder);
    });
    await staffOrders.queue.selectFilter(OrderQueueFilter.PREPARING);
    await test.step("После выбора «Готовятся» показаны только готовящиеся заказы.", async () => {
      expect(
        await staffOrders.queue.readCurrentStage(preparingOrder),
        "Показан готовящийся заказ.",
      ).toBe(OrderQueueStage.PREPARING);
      await staffOrders.queue.assertOrderHidden(createdOrder);
    });
    await staffOrders.queue.selectFilter(OrderQueueFilter.ALL);
    await test.step("После выбора «Все» показаны все подготовленные заказы.", async () => {
      await staffOrders.queue.assertOrderVisible(createdOrder);
      await staffOrders.queue.assertOrderVisible(preparingOrder);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные позиции каталога через UI.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(
        createdData.categoryName,
      );
      await menuManagement.productEditor.deleteIfPresent(
        createdData.productName,
      );
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        createdData.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(
        createdData.categoryName,
      );
      await menuManagement.catalog.expandCategoryIfPresent(
        preparingData.categoryName,
      );
      await menuManagement.productEditor.deleteIfPresent(
        preparingData.productName,
      );
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        preparingData.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(
        preparingData.categoryName,
      );
      await backOfficeAuth.form.signOut();
    });
  }
});
