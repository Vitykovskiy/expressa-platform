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
 * Назначение: подтвердить отмену и подтверждение архивирования товара.
 *
 * Предусловия: администратор и покупатель авторизованы; в категории есть товар;
 * покупатель имеет завершённый заказ с этим товаром.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает редактирование товара.
 * 3. Администратор нажимает «Удалить товар».
 * 4. Администратор отменяет удаление товара.
 * 5. Администратор нажимает «Удалить товар».
 * 6. Администратор подтверждает удаление товара.
 * 7. Покупатель открывает раздел «История».
 * 8. Покупатель открывает завершённый заказ.
 *
 * Ожидаемый результат:
 * - После отмены товар остаётся в категории.
 * - После подтверждения товар отсутствует среди активных товаров категории.
 * - Покупатель видит неизменный снимок товара, размера, добавок, количества и суммы завершённого заказа.
 */
test("CATALOG-12: администратор архивирует товар без изменения заказа", async ({
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
  const categoryName = `E2E Архив товара ${testInfo.testId}`;
  const productName = `E2E Товар архива ${testInfo.testId}`;
  const modifierGroupName = `E2E Добавки товара ${testInfo.testId}`;
  const modifierName = `E2E Добавка товара ${testInfo.testId}`;

  try {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription(
      "Категория для архива товара",
    );
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
    await menuManagement.productEditor.openForEditing(productName);
    await menuManagement.productEditor.requestArchive(productName);
    await menuManagement.productEditor.cancelArchive(productName);
    await test.step("После отмены товар остаётся в категории.", async () => {
      expect(
        await menuManagement.catalog.isProductVisible(productName),
        "После отмены товар остаётся в активной категории.",
      ).toBe(true);
    });
    await menuManagement.productEditor.requestArchive(productName);
    await menuManagement.productEditor.confirmArchive(productName);
    await test.step("После подтверждения товар отсутствует среди активных товаров категории.", async () => {
      expect(
        await menuManagement.catalog.isProductAbsent(productName),
        "После подтверждения товар отсутствует среди активных товаров категории.",
      ).toBe(true);
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
    await test.step("Покупатель видит неизменный снимок товара, размера, добавок, количества и суммы завершённого заказа.", async () => {
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
