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
 * Назначение: сотрудник открывает состав и историю изменения стадии заказа.
 *
 * Предусловия: barista или administrator вошёл в back-office; в очереди есть заказ с позицией, клиентом и хотя бы одним переходом стадии.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник открывает детали подготовленного заказа.
 *
 * Ожидаемый результат:
 * - Детали показывают клиента, состав, количество, размер и добавки позиции.
 * - Детали показывают сумму заказа.
 * - История стадий показывает предыдущую и новую стадию, время и автора каждого перехода.
 * - Стадии в истории показаны в бизнес-терминах, включая «Оформлен» и «Готов».
 */
test("QUEUE-05: сотрудник открывает детали заказа", async ({
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
    const order =
      await test.step("Подготовка: administrator публикует товар, customer оформляет заказ с позицией и добавкой.", async () => {
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
        await checkout.cart.setQuantity(data.productName, data.productQuantity);
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
    await test.step("Подготовка: staff входит в back-office и создаёт историю заказа до готовности.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.staff);
      await staffOrders.open();
      await staffOrders.queue.openDetails(order);
      await staffOrders.queue.transition(
        order,
        OrderQueueTransitionAction.ACCEPT,
      );
      await staffOrders.queue.transition(
        order,
        OrderQueueTransitionAction.START_PREPARING,
      );
      await staffOrders.queue.transition(
        order,
        OrderQueueTransitionAction.MARK_READY,
      );
    });
    const details = await staffOrders.queue.readDetails(order);
    const history = await staffOrders.queue.readTransitionHistory(order);
    await test.step("Детали показывают клиента, состав, количество, размер и добавки позиции.", async () => {
      expect(details.customer, "Клиент заказа показан.").toBe(
        e2eCredentials.customer.phone,
      );
      expect(details.items, "Состав заказа показан.").toHaveLength(1);
      expect(
        details.items[0],
        "Позиция содержит количество, размер и добавку.",
      ).toContain(data.productName);
      expect(details.items[0], "Количество позиции показано.").toContain(
        String(data.productQuantity),
      );
      expect(details.items[0], "Размер позиции показан.").toContain(
        data.productSize,
      );
      expect(details.items[0], "Добавка позиции показана.").toContain(
        data.modifierName,
      );
    });
    await test.step("Детали показывают сумму заказа.", async () => {
      expect(
        await staffOrders.queue.readOrderTotal(order),
        "Сумма заказа показана.",
      ).toBe(order.total);
    });
    await test.step("История стадий показывает предыдущую и новую стадию, время и автора каждого перехода.", async () => {
      expect(
        history,
        "История содержит все выполненные переходы.",
      ).toHaveLength(3);
      expect(
        history[0]?.occurredAt,
        "Время первого перехода показано.",
      ).not.toBe("");
      expect(history[0]?.author, "Автор первого перехода показан.").not.toBe(
        "",
      );
      expect(
        history[1]?.occurredAt,
        "Время второго перехода показано.",
      ).not.toBe("");
      expect(history[1]?.author, "Автор второго перехода показан.").not.toBe(
        "",
      );
      expect(
        history[2]?.occurredAt,
        "Время третьего перехода показано.",
      ).not.toBe("");
      expect(history[2]?.author, "Автор третьего перехода показан.").not.toBe(
        "",
      );
    });
    await test.step("Стадии в истории показаны в бизнес-терминах, включая «Оформлен» и «Готов».", async () => {
      expect(
        history[0]?.from,
        "Исходная стадия показана в бизнес-термине.",
      ).toBe(QueueScenarioStage.CREATED);
      expect(history[2]?.to, "Готовая стадия показана в бизнес-термине.").toBe(
        QueueScenarioStage.READY,
      );
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
