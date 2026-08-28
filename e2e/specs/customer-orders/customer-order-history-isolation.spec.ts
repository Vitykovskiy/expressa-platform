import {
  expect,
  ModifierSelectionType,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: история содержит только заказы авторизованного customer.
 *
 * Предусловия: два customer имеют разные завершённые заказы; первый customer авторизован.
 *
 * Сценарий:
 * 1. Первый customer открывает раздел «История».
 *
 * Ожидаемый результат:
 * - Первый customer видит только собственные заказы.
 * - Первый customer не видит номер, состав, сумму и стадию заказа второго customer.
 */
test("ORDER-05: история customer изолирована от заказов другого customer", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  multiSession,
  orderHistory,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  try {
    await test.step("Подготовка: administrator публикует напиток с обязательной добавкой.", async () => {
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
    });
    const ownOrder =
      await test.step("Подготовка: первый customer оформляет собственный заказ.", async () => {
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(data.categoryName);
        await publicMenu.product.openProduct(data);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(data.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(data.customerName);
        await checkout.cart.placeOrder();
        return customerOrder.details.readSnapshot();
      });
    const foreignOrder =
      await test.step("Подготовка: второй customer оформляет другой заказ.", async () => {
        const secondCustomer = multiSession.secondCustomer;

        await secondCustomer.menu.open(e2eEnvironment.frontOfficeUrl);
        await secondCustomer.menu.product.openCategory(data.categoryName);
        await secondCustomer.menu.product.openProduct(data);
        await secondCustomer.menu.product.selectVariant(
          ProductConfiguratorSize.M,
        );
        await secondCustomer.menu.product.selectModifier(data.modifierName);
        await secondCustomer.menu.product.addToCart();
        await secondCustomer.checkout.cart.open();
        await secondCustomer.checkout.cart.startCheckout();
        await secondCustomer.checkout.phoneVerification.fillPhone(
          e2eCredentials.secondCustomer.phone,
        );
        await secondCustomer.checkout.phoneVerification.requestCode();
        await secondCustomer.checkout.phoneVerification.fillCode(
          e2eCredentials.secondCustomer.otp,
        );
        await secondCustomer.checkout.phoneVerification.confirm();
        await secondCustomer.checkout.profile.completeProfileIfShown(
          `Гость ${testInfo.testId}`,
        );
        await secondCustomer.checkout.cart.placeOrder();
        return secondCustomer.order.details.readSnapshot();
      });
    await test.step("Подготовка: staff выдаёт оба заказа через UI.", async () => {
      const staff = multiSession.staff;

      await staff.auth.open(e2eEnvironment.backOfficeUrl);
      await staff.auth.form.signIn(e2eCredentials.staff);
      await staff.orders.queue.waitReady();
      for (const order of [ownOrder, foreignOrder]) {
        await staff.orders.queue.openDetails(order);
        await staff.orders.queue.transition(
          order,
          OrderQueueTransitionAction.ACCEPT,
        );
        await staff.orders.queue.transition(
          order,
          OrderQueueTransitionAction.START_PREPARING,
        );
        await staff.orders.queue.transition(
          order,
          OrderQueueTransitionAction.MARK_READY,
        );
        await staff.orders.queue.transition(
          order,
          OrderQueueTransitionAction.ISSUE,
        );
      }
      await staff.auth.form.signOut();
    });
    await test.step("Подготовка: первый customer авторизуется для просмотра истории.", async () => {
      await customerAuth.open(e2eEnvironment.frontOfficeUrl);
      await customerAuth.phoneVerification.fillPhone(
        e2eCredentials.customer.phone,
      );
      await customerAuth.phoneVerification.requestCode();
      await customerAuth.phoneVerification.fillCode(
        e2eCredentials.customer.otp,
      );
      await customerAuth.phoneVerification.confirm();
    });

    await orderHistory.open();

    await test.step("Первый customer видит только собственные заказы.", async () => {
      const entry = await orderHistory.history.readOrder(ownOrder);

      expect(entry.number, "Собственный заказ показан в истории.").toBe(
        ownOrder.number,
      );
    });
    await test.step("Первый customer не видит номер, состав, сумму и стадию заказа второго customer.", async () => {
      expect(
        await orderHistory.history.isOrderAbsent(foreignOrder.number),
        "Номер чужого заказа не показан в истории.",
      ).toBe(true);
      expect(
        await orderHistory.history.isOrderAbsent(foreignOrder.number),
        "Состав чужого заказа не показан в истории.",
      ).toBe(true);
      expect(
        await orderHistory.history.isOrderAbsent(foreignOrder.number),
        "Сумма чужого заказа не показана в истории.",
      ).toBe(true);
      expect(
        await orderHistory.history.isOrderAbsent(foreignOrder.number),
        "Стадия чужого заказа не показана в истории.",
      ).toBe(true);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные позиции каталога через UI.", async () => {
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
