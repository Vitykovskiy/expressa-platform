import {
  expect,
  ModifierSelectionType,
  OrderHistoryStatus,
  OrderStatus,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: проверить путь от публикации напитка до истории выданного заказа.
 *
 * Предусловия: administrator, staff и customer могут войти в приложения; customer может получить OTP.
 *
 * Сценарий:
 * 1. Administrator входит в back-office.
 * 2. Administrator открывает управление меню.
 * 3. Administrator начинает создание категории.
 * 4. Administrator указывает название категории.
 * 5. Administrator указывает описание категории.
 * 6. Administrator сохраняет категорию.
 * 7. Administrator начинает создание напитка.
 * 8. Administrator выбирает категорию напитка.
 * 9. Administrator выбирает тип напитка.
 * 10. Administrator указывает название напитка.
 * 11. Administrator указывает описание напитка.
 * 12. Administrator устанавливает цену размера M.
 * 13. Administrator сохраняет напиток.
 * 14. Administrator открывает управление группами добавок.
 * 15. Administrator начинает создание группы добавок.
 * 16. Administrator указывает название группы добавок.
 * 17. Administrator делает выбор обязательным.
 * 18. Administrator выбирает одиночный тип группы.
 * 19. Administrator добавляет вариант добавки.
 * 20. Administrator указывает название добавки.
 * 21. Administrator устанавливает нулевую цену добавки.
 * 22. Administrator выбирает добавку по умолчанию.
 * 23. Administrator сохраняет группу добавок.
 * 24. Administrator открывает назначения категории.
 * 25. Administrator выбирает группу добавок категории.
 * 26. Administrator сохраняет назначения категории.
 * 27. Customer открывает публичное меню.
 * 28. Customer открывает категорию.
 * 29. Customer открывает напиток.
 * 30. Customer выбирает размер M.
 * 31. Customer выбирает обязательную добавку.
 * 32. Customer добавляет напиток в корзину.
 * 33. Customer открывает корзину.
 * 34. Customer устанавливает количество два.
 * 35. Customer начинает оформление заказа.
 * 36. Customer указывает номер телефона.
 * 37. Customer запрашивает одноразовый код.
 * 38. Customer указывает одноразовый код.
 * 39. Customer подтверждает номер телефона.
 * 40. Customer указывает имя при первой регистрации.
 * 41. Customer подтверждает оформление заказа.
 * 42. Customer читает созданный заказ.
 * 43. Staff входит в back-office.
 * 44. Staff ожидает загрузки очереди.
 * 45. Staff открывает детали оформленного заказа.
 * 46. Staff принимает заказ.
 * 47. Staff начинает приготовление заказа.
 * 48. Staff отмечает заказ готовым.
 * 49. После внешней оплаты customer staff выдаёт заказ.
 * 50. Customer открывает front-office.
 * 51. Customer указывает номер телефона.
 * 52. Customer запрашивает одноразовый код.
 * 53. Customer указывает одноразовый код.
 * 54. Customer подтверждает номер телефона.
 * 55. Customer указывает имя при первой регистрации.
 * 56. Customer открывает историю заказов.
 * 57. Customer обновляет историю заказов.
 * 58. Customer открывает выданный заказ.
 *
 * Ожидаемый результат:
 * - Customer видит выданный заказ с неизменяемыми составом и итогом в истории.
 */
test("JOURNEY-05: публикация, заказ, выдача и история", async ({
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
  try {
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
    await menuManagement.productEditor.fillDescription(data.productDescription);
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
    await menuManagement.modifierGroupEditor.fillOptionName(data.modifierName);
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
    await checkout.phoneVerification.fillPhone(e2eCredentials.customer.phone);
    await checkout.phoneVerification.requestCode();
    await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await checkout.phoneVerification.confirm();
    await checkout.profile.completeProfileIfShown(data.customerName);
    await checkout.cart.placeOrder();
    const snapshot = await customerOrder.details.readSnapshot();
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.staff);
    await staffOrders.queue.waitReady();
    await staffOrders.queue.openDetails(snapshot);
    await staffOrders.queue.accept(snapshot);
    await staffOrders.queue.startPreparing(snapshot);
    await staffOrders.queue.markReady(snapshot);
    await staffOrders.queue.issue(snapshot);
    await backOfficeAuth.form.signOut();
    await customerAuth.open(e2eEnvironment.frontOfficeUrl);
    await customerAuth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await customerAuth.phoneVerification.requestCode();
    await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await customerAuth.phoneVerification.confirm();
    await customerAuth.profile.completeProfileIfShown(data.customerName);
    await orderHistory.open();
    await orderHistory.history.refresh();
    await orderHistory.history.openOrder(snapshot);
    await test.step("Результат: история показывает неизменяемый выданный заказ.", async () => {
      const [historyOrder, issuedOrder] = await Promise.all([
        orderHistory.history.readOrder(snapshot),
        customerOrder.details.readSnapshot(),
      ]);

      expect(historyOrder.number, "Номер заказа сохранён в истории.").toBe(
        snapshot.number,
      );
      expect(historyOrder.status, "В истории показана стадия «Выдан».").toBe(
        OrderHistoryStatus.ISSUED,
      );
      expect(historyOrder.total, "Итог в истории сохранён.").toBe(
        snapshot.total,
      );
      expect(
        issuedOrder.productName,
        "Наименование товара не изменилось.",
      ).toBe(snapshot.productName);
      expect(issuedOrder.size, "Размер товара не изменился.").toBe(
        snapshot.size,
      );
      expect(issuedOrder.modifierName, "Добавка не изменилась.").toBe(
        snapshot.modifierName,
      );
      expect(issuedOrder.quantity, "Количество товара не изменилось.").toBe(
        snapshot.quantity,
      );
      expect(issuedOrder.total, "Итог в деталях сохранён.").toBe(
        snapshot.total,
      );
      expect(issuedOrder.status, "В деталях показана стадия «Выдан».").toBe(
        OrderStatus.ISSUED,
      );
    });
  } finally {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
    await menuManagement.productEditor.archiveIfPresent(data.productName);
    await menuManagement.modifierGroupEditor.archiveIfPresent(
      data.modifierGroupName,
    );
    await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
    await menuManagement.catalog.assertScenarioAbsent(data);
  }
});
