import {
  expect,
  ModifierSelectionType,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: customer не может просмотреть заказ другого customer.
 *
 * Предусловия: два customer имеют разные заказы; первый customer авторизован и располагает ссылкой на заказ второго customer.
 *
 * Сценарий:
 * 1. Первый customer открывает ссылку на заказ второго customer.
 *
 * Ожидаемый результат:
 * - Первый customer видит сообщение о недоступности заказа.
 * - Первый customer не видит состав, сумму и стадию чужого заказа.
 */
test("ORDER-02: customer не открывает чужой заказ", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  multiSession,
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
    await test.step("Подготовка: первый customer оформляет собственный заказ.", async () => {
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(data.categoryName);
      await publicMenu.product.openProduct(data);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
      await publicMenu.product.selectModifier(data.modifierName);
      await publicMenu.product.addToCart();
      await checkout.cart.open();
      await checkout.cart.startCheckout();
      await checkout.phoneVerification.fillPhone(e2eCredentials.customer.phone);
      await checkout.phoneVerification.requestCode();
      await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
      await checkout.phoneVerification.confirm();
      await checkout.profile.completeProfileIfShown(data.customerName);
      await checkout.cart.placeOrder();
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
    await test.step("Подготовка: первый customer авторизуется для просмотра ссылки.", async () => {
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

    await customerOrder.open(e2eEnvironment.frontOfficeUrl, foreignOrder.id);

    await test.step("Первый customer видит сообщение о недоступности заказа.", async () => {
      expect(
        await customerOrder.details.isUnavailableMessageVisible(),
        "Показано сообщение о недоступности чужого заказа.",
      ).toBe(true);
    });
    await test.step("Первый customer не видит состав, сумму и стадию чужого заказа.", async () => {
      expect(
        await customerOrder.details.areItemsAbsent(),
        "Состав чужого заказа не показан.",
      ).toBe(true);
      expect(
        await customerOrder.details.isTotalAbsent(),
        "Сумма чужого заказа не показана.",
      ).toBe(true);
      expect(
        await customerOrder.details.areStatusesAbsent(),
        "Стадия чужого заказа не показана.",
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
