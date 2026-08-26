import { test } from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: подтвердить оформление одного заказа с сохранением конфигурации после OTP.
 *
 * Предусловия: администратор может войти в back-office; клиент доступен по OTP.
 *
 * Сценарий: администратор публикует уникальную конфигурацию, клиент добавляет её в
 * корзину, подтверждает телефон и оформляет заказ, после чего данные сценария очищаются.
 *
 * Контрольные точки: созданный заказ сохраняет идентификатор, одну позицию, вариант,
 * обязательную добавку, количество и итог.
 *
 * Ожидаемый результат: одно подтверждение создаёт заказ с точным составом корзины;
 * конфигурация удаляется из управления каталогом через UI.
 */
test("Клиент оформляет независимый уникальный заказ после подтверждения телефона", async ({
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
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

  await test.step("Сохранить снимок созданного заказа", async () => {
    await customerOrder.details.readSnapshot(data);
  });

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
