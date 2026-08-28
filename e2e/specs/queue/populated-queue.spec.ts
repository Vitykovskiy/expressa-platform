import {
  expect,
  ModifierSelectionType,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  QueueScenarioStage,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: сотрудник видит подготовленные заказы в очереди.
 *
 * Предусловия: barista или administrator вошёл в back-office; в очереди есть заказы на разных стадиях.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 *
 * Ожидаемый результат:
 * - Для каждого подготовленного заказа показана карточка.
 * - Карточка показывает номер, дату и время, текущую стадию и сумму заказа.
 * - Стадии показаны в бизнес-терминах, включая «Оформлен» и «Готов».
 */
test("QUEUE-02: сотрудник видит заполненную очередь заказов", async ({
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
  staffOrders,
}, testInfo) => {
  const firstData = createProductOrderScenarioData(`${testInfo.testId}-first`);
  const secondData = createProductOrderScenarioData(
    `${testInfo.testId}-second`,
  );
  try {
    const firstOrder =
      await test.step("Подготовка: administrator публикует первый товар, customer оформляет первый заказ.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.categoryEditor.startCreation();
        await menuManagement.categoryEditor.fillName(firstData.categoryName);
        await menuManagement.categoryEditor.fillDescription(
          firstData.productDescription,
        );
        await menuManagement.categoryEditor.save(firstData.categoryName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          firstData.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(firstData.productName);
        await menuManagement.productEditor.fillDescription(
          firstData.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          firstData.productPrice,
        );
        await menuManagement.productEditor.save(firstData.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          firstData.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          firstData.modifierName,
        );
        await menuManagement.modifierGroupEditor.setOptionPrice("0");
        await menuManagement.modifierGroupEditor.setOptionDefault();
        await menuManagement.modifierGroupEditor.save();
        await menuManagement.assignments.openCategory(firstData.categoryName);
        await menuManagement.assignments.selectGroup(
          firstData.modifierGroupName,
        );
        await menuManagement.assignments.save();
        await backOfficeAuth.form.signOut();
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(firstData.categoryName);
        await publicMenu.product.openProduct(firstData);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(firstData.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(
          firstData.productName,
          firstData.productQuantity,
        );
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(firstData.customerName);
        await checkout.cart.placeOrder();
        return customerOrder.details.readSnapshot();
      });
    const secondOrder =
      await test.step("Подготовка: administrator публикует второй товар, customer оформляет второй заказ.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.categoryEditor.startCreation();
        await menuManagement.categoryEditor.fillName(secondData.categoryName);
        await menuManagement.categoryEditor.fillDescription(
          secondData.productDescription,
        );
        await menuManagement.categoryEditor.save(secondData.categoryName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          secondData.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(secondData.productName);
        await menuManagement.productEditor.fillDescription(
          secondData.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          secondData.productPrice,
        );
        await menuManagement.productEditor.save(secondData.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          secondData.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          secondData.modifierName,
        );
        await menuManagement.modifierGroupEditor.setOptionPrice("0");
        await menuManagement.modifierGroupEditor.setOptionDefault();
        await menuManagement.modifierGroupEditor.save();
        await menuManagement.assignments.openCategory(secondData.categoryName);
        await menuManagement.assignments.selectGroup(
          secondData.modifierGroupName,
        );
        await menuManagement.assignments.save();
        await backOfficeAuth.form.signOut();
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(secondData.categoryName);
        await publicMenu.product.openProduct(secondData);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(secondData.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(
          secondData.productName,
          secondData.productQuantity,
        );
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(secondData.customerName);
        await checkout.cart.placeOrder();
        return customerOrder.details.readSnapshot();
      });
    await test.step("Подготовка: staff входит в back-office и переводит второй заказ до готовности.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.staff);
      await staffOrders.open();
      await staffOrders.queue.openDetails(secondOrder);
      await staffOrders.queue.transition(
        secondOrder,
        OrderQueueTransitionAction.ACCEPT,
      );
      await staffOrders.queue.transition(
        secondOrder,
        OrderQueueTransitionAction.START_PREPARING,
      );
      await staffOrders.queue.transition(
        secondOrder,
        OrderQueueTransitionAction.MARK_READY,
      );
    });

    await test.step("Для каждого подготовленного заказа показана карточка.", async () => {
      await staffOrders.queue.assertOrderVisible(firstOrder);
      await staffOrders.queue.assertOrderVisible(secondOrder);
    });
    await test.step("Карточка показывает номер, дату и время, текущую стадию и сумму заказа.", async () => {
      expect(
        await staffOrders.queue.isOrderCreatedAtVisible(firstOrder),
        "Дата и время первого заказа показаны.",
      ).toBe(true);
      expect(
        await staffOrders.queue.readOrderTotal(firstOrder),
        "Сумма первого заказа показана.",
      ).toBe(firstOrder.total);
      expect(
        await staffOrders.queue.isOrderCreatedAtVisible(secondOrder),
        "Дата и время второго заказа показаны.",
      ).toBe(true);
      expect(
        await staffOrders.queue.readOrderTotal(secondOrder),
        "Сумма второго заказа показана.",
      ).toBe(secondOrder.total);
    });
    await test.step("Стадии показаны в бизнес-терминах, включая «Оформлен» и «Готов».", async () => {
      expect(
        await staffOrders.queue.readCurrentStage(firstOrder),
        "Оформленный заказ показан в бизнес-термине.",
      ).toBe(QueueScenarioStage.CREATED);
      expect(
        await staffOrders.queue.readCurrentStage(secondOrder),
        "Готовый заказ показан в бизнес-термине.",
      ).toBe(QueueScenarioStage.READY);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные позиции каталога через UI.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(
        firstData.categoryName,
      );
      await menuManagement.productEditor.deleteIfPresent(firstData.productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        firstData.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(
        firstData.categoryName,
      );
      await menuManagement.catalog.expandCategoryIfPresent(
        secondData.categoryName,
      );
      await menuManagement.productEditor.deleteIfPresent(
        secondData.productName,
      );
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        secondData.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(
        secondData.categoryName,
      );
      await backOfficeAuth.form.signOut();
    });
  }
});
