import {
  expect,
  ModifierSelectionType,
  OrderStatus,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: customer видит состав и сумму созданного заказа без изменений.
 *
 * Предусловия: customer авторизован и оформил заказ с напитком, размером, добавкой и известным количеством; administrator архивировал элементы меню заказа.
 *
 * Сценарий:
 * 1. Customer открывает созданный заказ.
 *
 * Ожидаемый результат:
 * - Customer видит номер и текущую стадию заказа.
 * - Customer видит исходные наименование товара, размер, добавку и количество.
 * - Customer видит исходную цену позиции, исходную итоговую сумму и текст об оплате при получении.
 */
test("ORDER-01: customer видит снимок созданного заказа", async ({
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  try {
    await test.step("Подготовка: administrator публикует напиток с обязательной добавкой, customer оформляет заказ.", async () => {
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
    const snapshot = await customerOrder.details.readSnapshot();
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
    await menuManagement.productEditor.deleteIfPresent(data.productName);
    await backOfficeAuth.form.signOut();
    await customerOrder.open(e2eEnvironment.frontOfficeUrl, snapshot.id);
    await test.step("Customer видит номер и текущую стадию заказа.", async () => {
      const order = await customerOrder.details.readSnapshot();
      expect(order.number, "Номер заказа сохранён.").toBe(snapshot.number);
      expect(order.status, "Стадия созданного заказа сохранена.").toBe(
        OrderStatus.CREATED,
      );
    });
    await test.step("Customer видит исходные наименование товара, размер, добавку и количество.", async () => {
      const order = await customerOrder.details.readSnapshot();
      expect(order.productName, "Наименование товара сохранено.").toBe(
        snapshot.productName,
      );
      expect(order.size, "Размер сохранён.").toBe(snapshot.size);
      expect(order.modifierName, "Добавка сохранена.").toBe(
        snapshot.modifierName,
      );
      expect(order.quantity, "Количество сохранено.").toBe(snapshot.quantity);
    });
    await test.step("Customer видит исходную цену позиции, исходную итоговую сумму и текст об оплате при получении.", async () => {
      const order = await customerOrder.details.readSnapshot();
      expect(order.lineTotal, "Цена позиции сохранена.").toBe(
        snapshot.lineTotal,
      );
      expect(order.total, "Итог заказа сохранён.").toBe(snapshot.total);
      expect(
        await customerOrder.details.readPaymentMethod(),
        "Показана оплата при получении.",
      ).toBe("Оплата на кассе при получении");
    });
  } finally {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.modifierGroupEditor.archiveIfPresent(
      data.modifierGroupName,
    );
    await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
    await backOfficeAuth.form.signOut();
  }
});
