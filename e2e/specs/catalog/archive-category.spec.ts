import {
  ModifierSelectionType,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  expect,
  test,
} from "@fixtures/test";

/**
 * Назначение: подтвердить отмену и подтверждение архивирования категории.
 *
 * Предусловия: administrator и customer авторизованы; в каталоге есть категория;
 * customer имеет завершённый заказ с товаром этой категории.
 *
 * Сценарий:
 * 1. Administrator открывает управление меню.
 * 2. Administrator открывает редактирование категории.
 * 3. Administrator нажимает «Архивировать категорию».
 * 4. Administrator отменяет архивирование.
 * 5. Administrator нажимает «Архивировать категорию».
 * 6. Administrator подтверждает архивирование.
 * 7. Customer открывает раздел «История».
 * 8. Customer открывает завершённый заказ.
 *
 * Ожидаемый результат:
 * - После отмены категория остаётся в каталоге.
 * - После подтверждения категория отсутствует среди активных категорий.
 * - Customer видит неизменный снимок товара, размера, добавок, количества и суммы завершённого заказа.
 */
test("CATALOG-06: administrator архивирует категорию без изменения заказа", async ({
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
  const categoryName = `E2E Архив ${testInfo.testId}`;
  const productName = `E2E Товар ${testInfo.testId}`;
  const modifierGroupName = `E2E Добавки ${testInfo.testId}`;
  const modifierName = `E2E Добавка ${testInfo.testId}`;

  try {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription("Категория для архива");
    await menuManagement.categoryEditor.save(categoryName);
    await menuManagement.productEditor.startCreation();
    await menuManagement.productEditor.selectCategory(categoryName);
    await menuManagement.productEditor.selectType(ProductType.DRINK);
    await menuManagement.productEditor.fillName(productName);
    await menuManagement.productEditor.fillDescription("Товар для архива");
    await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
    await menuManagement.productEditor.setPrice(ProductEditorSize.M, "199");
    await menuManagement.productEditor.save(productName);
    await menuManagement.modifierGroupEditor.openManagement();
    await menuManagement.modifierGroupEditor.startCreation();
    await menuManagement.modifierGroupEditor.fillName(modifierGroupName);
    await menuManagement.modifierGroupEditor.setRequired();
    await menuManagement.modifierGroupEditor.selectType(
      ModifierSelectionType.SINGLE,
    );
    await menuManagement.modifierGroupEditor.addOption();
    await menuManagement.modifierGroupEditor.fillOptionName(modifierName);
    await menuManagement.modifierGroupEditor.setOptionPrice("0");
    await menuManagement.modifierGroupEditor.setOptionDefault();
    await menuManagement.modifierGroupEditor.save();
    await menuManagement.assignments.openCategory(categoryName);
    await menuManagement.assignments.selectGroup(modifierGroupName);
    await menuManagement.assignments.save();
    await backOfficeAuth.form.signOut();

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(categoryName);
    await publicMenu.product.openProduct(productName);
    await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
    await publicMenu.product.selectModifier(modifierName);
    await publicMenu.product.addToCart();
    await checkout.cart.open();
    await checkout.cart.startCheckout();
    await checkout.phoneVerification.fillPhone(e2eCredentials.customer.phone);
    await checkout.phoneVerification.requestCode();
    await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await checkout.phoneVerification.confirm();
    await checkout.profile.completeProfileIfShown("E2E Customer");
    await checkout.cart.placeOrder();
    const snapshot = await customerOrder.details.readSnapshot();

    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.staff);
    await staffOrders.open();
    await staffOrders.queue.openDetails(snapshot);
    await staffOrders.queue.transition(
      snapshot,
      OrderQueueTransitionAction.ACCEPT,
    );
    await staffOrders.queue.transition(
      snapshot,
      OrderQueueTransitionAction.START_PREPARING,
    );
    await staffOrders.queue.transition(
      snapshot,
      OrderQueueTransitionAction.MARK_READY,
    );
    await staffOrders.queue.transition(
      snapshot,
      OrderQueueTransitionAction.ISSUE,
    );
    await backOfficeAuth.form.signOut();

    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.categoryEditor.openForEditing(categoryName);
    await menuManagement.categoryEditor.requestArchive(categoryName);
    await menuManagement.categoryEditor.cancelArchive(categoryName);
    await test.step("После отмены категория остаётся в каталоге.", async () => {
      expect(
        await menuManagement.catalog.hasCategory(categoryName),
        "После отмены категория остаётся в активном каталоге.",
      ).toBe(true);
    });
    await menuManagement.categoryEditor.requestArchive(categoryName);
    await menuManagement.categoryEditor.confirmArchive(categoryName);
    await test.step("После подтверждения категория отсутствует среди активных категорий.", async () => {
      expect(
        await menuManagement.catalog.hasCategory(categoryName),
        "После подтверждения категория отсутствует среди активных категорий.",
      ).toBe(false);
    });
    await backOfficeAuth.form.signOut();

    await customerAuth.open(e2eEnvironment.frontOfficeUrl);
    await customerAuth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await customerAuth.phoneVerification.requestCode();
    await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await customerAuth.phoneVerification.confirm();
    await orderHistory.open();
    await orderHistory.history.openOrder(snapshot);

    await test.step("Customer видит неизменный снимок товара, размера, добавок, количества и суммы завершённого заказа.", async () => {
      const archivedSnapshot = await customerOrder.details.readSnapshot();

      expect(
        archivedSnapshot.productName,
        "Товар завершённого заказа не изменился.",
      ).toBe(snapshot.productName);
      expect(
        archivedSnapshot.size,
        "Размер завершённого заказа не изменился.",
      ).toBe(snapshot.size);
      expect(
        archivedSnapshot.modifierName,
        "Добавка завершённого заказа не изменилась.",
      ).toBe(snapshot.modifierName);
      expect(
        archivedSnapshot.quantity,
        "Количество завершённого заказа не изменилось.",
      ).toBe(snapshot.quantity);
      expect(
        archivedSnapshot.total,
        "Сумма завершённого заказа не изменилась.",
      ).toBe(snapshot.total);
    });
  } finally {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.productEditor.deleteIfPresent(productName);
    await menuManagement.modifierGroupEditor.archiveIfPresent(
      modifierGroupName,
    );
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
