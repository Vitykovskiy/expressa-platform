import { test } from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: связать BL-0166–BL-0170 в одном независимом браузерном сценарии.
 *
 * Предусловия: подготовленная среда доступна, сценарий использует уникальные данные.
 *
 * Сценарий: администратор публикует товар, клиент оформляет его после OTP, сотрудник
 * выдаёт заказ, клиент открывает историю, затем администратор очищает данные сценария.
 *
 * Контрольные точки: снимок созданного заказа содержит номер, товар, вариант, добавку,
 * количество и итог; выданный заказ в истории совпадает с этим снимком.
 *
 * Ожидаемый результат: путь BL-0166–BL-0170 создаёт, выдаёт и сохраняет в истории
 * один заказ с неизменным составом и итогом; данные сценария очищаются через UI.
 */
test("Клиент получает заказ из опубликованного администратором меню", async ({
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

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();
  await menuManagement.categoryEditor.create(data);
  await menuManagement.productEditor.create(data);
  await menuManagement.catalog.expandCategory(data.categoryName);
  await menuManagement.catalog.assertProductVisible(data.productName);
  await menuManagement.modifierGroupEditor.create(data);
  await menuManagement.assignments.assign(
    data.categoryName,
    data.modifierGroupName,
  );
  await backOfficeAuth.form.signOut();

  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory(data.categoryName);
  await publicMenu.product.openProduct(data);
  await publicMenu.product.selectVariant(data.productSize);
  await publicMenu.product.selectModifier(data.modifierName);
  await publicMenu.product.addToCart();
  await checkout.cart.open();
  await checkout.cart.setQuantity(data.productName, data.productQuantity);
  await checkout.cart.assertOrder(data);
  await checkout.cart.startCheckout();
  await checkout.phoneVerification.verify(e2eCredentials.customer);
  await checkout.profile.completeProfileIfShown(data.customerName);
  await checkout.cart.assertOrder(data);
  await checkout.cart.placeOrder();

  const snapshot =
    await test.step("Сохранить снимок созданного заказа", async () =>
      customerOrder.details.readSnapshot(data));

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.staff);
  await staffOrders.queue.waitReady();
  await staffOrders.queue.openDetails(snapshot);
  await staffOrders.queue.accept(snapshot);
  await staffOrders.queue.startPreparing(snapshot);
  await staffOrders.queue.markReady(snapshot);
  await staffOrders.queue.issue(snapshot);
  await backOfficeAuth.form.signOut();

  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.verify(e2eCredentials.customer);
  await customerAuth.profile.completeProfileIfShown(data.customerName);
  await orderHistory.open();
  await orderHistory.history.refresh();
  await orderHistory.history.openOrder(snapshot);

  await test.step("Сверить выданный заказ с сохранённым снимком", async () =>
    customerOrder.details.assertIssued(snapshot));

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();
  await menuManagement.productEditor.reopen(data);
  await menuManagement.productEditor.archive(data.productName);
  await menuManagement.modifierGroupEditor.archive(data.modifierGroupName);
  await menuManagement.categoryEditor.archive(data.categoryName);
  await menuManagement.catalog.assertScenarioAbsent(data);
  await backOfficeAuth.form.signOut();
});
