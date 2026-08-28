import {
  expect,
  ModifierSelectionType,
  OrderQueueTransitionAction,
  OrderStatus,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: customer просматривает собственный заказ до выдачи.
 *
 * Предусловия: customer авторизован; у customer есть собственный заказ на стадии «Оформлен»; barista может войти в back-office.
 *
 * Сценарий:
 * 1. Customer открывает собственный текущий заказ.
 * 2. Barista переводит этот заказ в стадию «Принят».
 *
 * Ожидаемый результат:
 * - Customer видит номер, исходную стадию, состав и итоговую сумму заказа.
 * - Customer видит автоматическое изменение стадии на «Принят».
 * - Customer видит текст об оплате на кассе при получении.
 */
test("ORDER-03: customer видит текущий заказ", async ({
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
  try {
    const snapshot =
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
    await customerOrder.open(e2eEnvironment.frontOfficeUrl, snapshot.id);
    await test.step("Customer видит номер, исходную стадию, состав и итоговую сумму заказа.", async () => {
      const order = await customerOrder.details.readSnapshot();
      expect(order.number, "Номер заказа показан.").toBe(snapshot.number);
      expect(order.status, "Показана исходная стадия.").toBe(
        OrderStatus.CREATED,
      );
      expect(order.productName, "Наименование товара сохранено.").toBe(
        snapshot.productName,
      );
      expect(order.size, "Размер товара сохранён.").toBe(snapshot.size);
      expect(order.modifierName, "Добавка сохранена.").toBe(
        snapshot.modifierName,
      );
      expect(order.quantity, "Количество товара сохранено.").toBe(
        snapshot.quantity,
      );
      expect(order.total, "Итог заказа сохранён.").toBe(snapshot.total);
    });
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.staff);
    await staffOrders.queue.waitReady();
    await staffOrders.queue.openDetails(snapshot);
    await staffOrders.queue.transition(
      snapshot,
      OrderQueueTransitionAction.ACCEPT,
    );
    await backOfficeAuth.form.signOut();
    await test.step("Customer видит автоматическое изменение стадии на «Принят».", async () => {
      const order = await customerOrder.details.readSnapshot();
      expect(order.status, "Показана стадия «Принят».").toBe(
        OrderStatus.ACCEPTED,
      );
    });
    await test.step("Customer видит текст об оплате на кассе при получении.", async () => {
      expect(
        await customerOrder.details.readPaymentMethod(),
        "Показана оплата при получении.",
      ).toBe("Оплата на кассе при получении");
    });
  } finally {
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
  }
});
