import { test } from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: подтвердить, что сотрудник выдаёт созданный клиентом заказ через UI.
 *
 * Предусловия: сценарий создаёт собственные уникальные каталог и заказ.
 *
 * Сценарий: администратор публикует товар, клиент оформляет заказ, сотрудник переводит
 * его до выдачи, затем администратор очищает данные сценария.
 *
 * Контрольные точки: снимок созданного заказа содержит номер и состав; сотрудник
 * последовательно переводит заказ через CREATED, ACCEPTED, PREPARING, READY и ISSUED.
 *
 * Ожидаемый результат: созданный заказ получает статус ISSUED, а данные сценария
 * отсутствуют в меню управления после UI-очистки.
 */
test("Сотрудник независимо переводит заказ до выдачи", async ({
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
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
