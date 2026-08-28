import {
  createProductOrderScenarioData,
  ModifierSelectionType,
  OrderQueueStage,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

import type { OrderSnapshot } from "@support/data/order-snapshot.types";

/**
 * Назначение: новый оформленный заказ автоматически появляется в уже открытой очереди сотрудника.
 *
 * Предусловия: administrator, staff и customer могут войти в свои интерфейсы;
 * customer может подтвердить номер телефона.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Customer оформляет подготовленную корзину.
 * 3. Сотрудник просматривает открытую очередь.
 *
 * Ожидаемый результат:
 * - Новый оформленный заказ появляется в открытой очереди.
 * - Остальные подходящие фильтру заказы остаются в очереди.
 */
test("QUEUE-06: очередь автоматически показывает новый заказ", async ({
  e2eCredentials,
  e2eEnvironment,
  multiSession,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  let existingOrder: OrderSnapshot | null = null;
  let newOrder: OrderSnapshot | null = null;

  try {
    await test.step("Подготовка: administrator публикует товар с обязательной добавкой через UI.", async () => {
      await multiSession.staff.auth.open(e2eEnvironment.backOfficeUrl);
      await multiSession.staff.auth.form.signIn(e2eCredentials.administrator);
      await multiSession.staff.menuManagement.open();
      await multiSession.staff.menuManagement.categoryEditor.startCreation();
      await multiSession.staff.menuManagement.categoryEditor.fillName(
        data.categoryName,
      );
      await multiSession.staff.menuManagement.categoryEditor.fillDescription(
        data.productDescription,
      );
      await multiSession.staff.menuManagement.categoryEditor.save(
        data.categoryName,
      );
      await multiSession.staff.menuManagement.productEditor.startCreation();
      await multiSession.staff.menuManagement.productEditor.selectCategory(
        data.categoryName,
      );
      await multiSession.staff.menuManagement.productEditor.selectType(
        ProductType.DRINK,
      );
      await multiSession.staff.menuManagement.productEditor.fillName(
        data.productName,
      );
      await multiSession.staff.menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await multiSession.staff.menuManagement.productEditor.useOnlySize(
        ProductEditorSize.M,
      );
      await multiSession.staff.menuManagement.productEditor.setPrice(
        ProductEditorSize.M,
        data.productPrice,
      );
      await multiSession.staff.menuManagement.productEditor.save(
        data.productName,
      );
      await multiSession.staff.menuManagement.modifierGroupEditor.openManagement();
      await multiSession.staff.menuManagement.modifierGroupEditor.startCreation();
      await multiSession.staff.menuManagement.modifierGroupEditor.fillName(
        data.modifierGroupName,
      );
      await multiSession.staff.menuManagement.modifierGroupEditor.setRequired();
      await multiSession.staff.menuManagement.modifierGroupEditor.selectType(
        ModifierSelectionType.SINGLE,
      );
      await multiSession.staff.menuManagement.modifierGroupEditor.addOption();
      await multiSession.staff.menuManagement.modifierGroupEditor.fillOptionName(
        data.modifierName,
      );
      await multiSession.staff.menuManagement.modifierGroupEditor.setOptionPrice(
        "0",
      );
      await multiSession.staff.menuManagement.modifierGroupEditor.setOptionDefault();
      await multiSession.staff.menuManagement.modifierGroupEditor.save();
      await multiSession.staff.menuManagement.assignments.openCategory(
        data.categoryName,
      );
      await multiSession.staff.menuManagement.assignments.selectGroup(
        data.modifierGroupName,
      );
      await multiSession.staff.menuManagement.assignments.save();
      await multiSession.staff.auth.form.signOut();
    });
    const preparedExistingOrder =
      await test.step("Подготовка: customer оформляет первый заказ, который остаётся в очереди.", async () => {
        await multiSession.secondCustomer.menu.open(
          e2eEnvironment.frontOfficeUrl,
        );
        await multiSession.secondCustomer.menu.product.openCategory(
          data.categoryName,
        );
        await multiSession.secondCustomer.menu.product.openProduct(data);
        await multiSession.secondCustomer.menu.product.selectVariant(
          ProductConfiguratorSize.M,
        );
        await multiSession.secondCustomer.menu.product.selectModifier(
          data.modifierName,
        );
        await multiSession.secondCustomer.menu.product.addToCart();
        await multiSession.secondCustomer.checkout.cart.open();
        await multiSession.secondCustomer.checkout.cart.setQuantity(
          data.productName,
          data.productQuantity,
        );
        await multiSession.secondCustomer.checkout.cart.startCheckout();
        await multiSession.secondCustomer.checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await multiSession.secondCustomer.checkout.phoneVerification.requestCode();
        await multiSession.secondCustomer.checkout.phoneVerification.fillCode(
          e2eCredentials.customer.otp,
        );
        await multiSession.secondCustomer.checkout.phoneVerification.confirm();
        await multiSession.secondCustomer.checkout.profile.completeProfileIfShown(
          data.customerName,
        );
        await multiSession.secondCustomer.checkout.cart.placeOrder();

        return multiSession.secondCustomer.order.details.readSnapshot();
      });
    existingOrder = preparedExistingOrder;
    await test.step("Подготовка: customer формирует вторую корзину через UI.", async () => {
      await multiSession.secondCustomer.menu.open(
        e2eEnvironment.frontOfficeUrl,
      );
      await multiSession.secondCustomer.menu.product.openCategory(
        data.categoryName,
      );
      await multiSession.secondCustomer.menu.product.openProduct(data);
      await multiSession.secondCustomer.menu.product.selectVariant(
        ProductConfiguratorSize.M,
      );
      await multiSession.secondCustomer.menu.product.selectModifier(
        data.modifierName,
      );
      await multiSession.secondCustomer.menu.product.addToCart();
      await multiSession.secondCustomer.checkout.cart.open();
      await multiSession.secondCustomer.checkout.cart.setQuantity(
        data.productName,
        data.productQuantity,
      );
    });
    await test.step("Подготовка: staff входит в back-office.", async () => {
      await multiSession.staff.auth.open(e2eEnvironment.backOfficeUrl);
      await multiSession.staff.auth.form.signIn(e2eCredentials.staff);
    });

    await multiSession.staff.orders.open();
    await multiSession.staff.orders.queue.assertOrderVisible(
      preparedExistingOrder,
    );
    await multiSession.secondCustomer.checkout.cart.placeOrder();
    const createdOrder =
      await multiSession.secondCustomer.order.details.readSnapshot();
    newOrder = createdOrder;

    await test.step("Новый оформленный заказ появляется в открытой очереди.", async () => {
      await multiSession.staff.orders.queue.assertOrderVisible(createdOrder);
    });
    await test.step("Остальные подходящие фильтру заказы остаются в очереди.", async () => {
      await multiSession.staff.orders.queue.assertOrderVisible(
        preparedExistingOrder,
      );
    });
  } finally {
    await test.step("Очистка: staff выдаёт созданные заказы через UI.", async () => {
      for (const order of [existingOrder, newOrder]) {
        if (order === null) continue;

        await multiSession.staff.orders.queue.openDetails(order);
        const stage =
          await multiSession.staff.orders.queue.readCurrentStage(order);

        if (stage === OrderQueueStage.CREATED) {
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.ACCEPT,
          );
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.START_PREPARING,
          );
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.MARK_READY,
          );
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.ISSUE,
          );
          continue;
        }

        if (stage === OrderQueueStage.ACCEPTED) {
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.START_PREPARING,
          );
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.MARK_READY,
          );
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.ISSUE,
          );
          continue;
        }

        if (stage === OrderQueueStage.PREPARING) {
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.MARK_READY,
          );
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.ISSUE,
          );
          continue;
        }

        if (stage === OrderQueueStage.READY) {
          await multiSession.staff.orders.queue.transition(
            order,
            OrderQueueTransitionAction.ISSUE,
          );
        }
      }
    });
    await test.step("Очистка: administrator удаляет созданные позиции каталога через UI.", async () => {
      await multiSession.staff.auth.form.signOut();
      await multiSession.staff.auth.open(e2eEnvironment.backOfficeUrl);
      await multiSession.staff.auth.form.signIn(e2eCredentials.administrator);
      await multiSession.staff.menuManagement.open();
      await multiSession.staff.menuManagement.catalog.expandCategoryIfPresent(
        data.categoryName,
      );
      await multiSession.staff.menuManagement.productEditor.deleteIfPresent(
        data.productName,
      );
      await multiSession.staff.menuManagement.modifierGroupEditor.archiveIfPresent(
        data.modifierGroupName,
      );
      await multiSession.staff.menuManagement.categoryEditor.archiveIfPresent(
        data.categoryName,
      );
      await multiSession.staff.auth.form.signOut();
    });
  }
});
