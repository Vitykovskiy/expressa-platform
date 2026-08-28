import {
  expect,
  ModifierSelectionType,
  OrderHistoryStatus,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

import type { OrderSnapshot } from "@support/data/order-snapshot.types";

/**
 * Назначение: customer просматривает историю собственных завершённых заказов.
 *
 * Предусловия: customer авторизован; у customer есть несколько завершённых заказов, включая заказы за пределами первого списка.
 *
 * Сценарий:
 * 1. Customer открывает раздел «История».
 * 2. Customer нажимает «Показать ещё».
 *
 * Ожидаемый результат:
 * - Customer видит собственные заказы от новых к старым.
 * - Для каждого заказа показаны номер, дата, сумма и стадия.
 * - Customer видит следующую часть истории без повторов заказов.
 */
test("ORDER-04: customer загружает следующую часть истории заказов", async ({
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
  const orders: OrderSnapshot[] = [];

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
    await test.step("Подготовка: customer создаёт и staff выдаёт двадцать один собственный заказ через UI.", async () => {
      await customerAuth.open(e2eEnvironment.frontOfficeUrl);
      await customerAuth.phoneVerification.fillPhone(
        e2eCredentials.customer.phone,
      );
      await customerAuth.phoneVerification.requestCode();
      await customerAuth.phoneVerification.fillCode(
        e2eCredentials.customer.otp,
      );
      await customerAuth.phoneVerification.confirm();
      await customerAuth.profile.completeProfileIfShown(data.customerName);

      for (let index = 0; index < 21; index += 1) {
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(data.categoryName);
        await publicMenu.product.openProduct(data);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(data.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.placeOrder();
        const order = await customerOrder.details.readSnapshot();
        orders.push(order);
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.staff);
        await staffOrders.queue.waitReady();
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
        await staffOrders.queue.transition(
          order,
          OrderQueueTransitionAction.ISSUE,
        );
        await backOfficeAuth.form.signOut();
      }
    });
    await test.step("Подготовка: customer авторизуется для просмотра истории.", async () => {
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
    await orderHistory.history.loadMore();

    await test.step("Customer видит собственные заказы от новых к старым.", async () => {
      const historyNumbers = await orderHistory.history.readOrderNumbers();
      let previousOrderIndex = -1;

      for (const order of [...orders].reverse()) {
        const orderIndex = historyNumbers.indexOf(order.number);

        expect(
          orderIndex,
          `Заказ ${order.number} показан в истории.`,
        ).toBeGreaterThan(previousOrderIndex);
        previousOrderIndex = orderIndex;
      }
    });
    await test.step("Для каждого заказа показаны номер, дата, сумма и стадия.", async () => {
      for (const order of orders) {
        const entry = await orderHistory.history.readOrder(order);

        expect(entry.number, `Показан номер заказа ${order.number}.`).toBe(
          order.number,
        );
        expect(
          entry.displayedDate,
          `Показана дата заказа ${order.number}.`,
        ).not.toBe("");
        expect(entry.total, `Показана сумма заказа ${order.number}.`).toBe(
          order.total,
        );
        expect(entry.status, `Показана стадия заказа ${order.number}.`).toBe(
          OrderHistoryStatus.ISSUED,
        );
      }
    });
    await test.step("Customer видит следующую часть истории без повторов заказов.", async () => {
      expect(
        await orderHistory.history.readOrderCount(),
        "Показана следующая часть истории.",
      ).toBeGreaterThan(20);
      expect(
        await orderHistory.history.hasUniqueOrderNumbers(),
        "Заказы в загруженной истории не повторяются.",
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
