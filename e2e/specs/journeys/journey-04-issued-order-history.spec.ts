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
 * Назначение: customer видит выданный заказ с сохранённым составом в истории.
 *
 * Предусловия: сценарий создаёт и выдаёт независимый заказ customer.
 *
 * Сценарий:
 * 1. Administrator открывает back-office.
 * 2. Administrator входит в back-office.
 * 3. Administrator открывает управление меню.
 * 4. Administrator начинает создание категории.
 * 5. Administrator указывает название категории.
 * 6. Administrator указывает описание категории.
 * 7. Administrator сохраняет категорию.
 * 8. Administrator начинает создание напитка.
 * 9. Administrator выбирает категорию напитка.
 * 10. Administrator выбирает тип напитка.
 * 11. Administrator указывает название напитка.
 * 12. Administrator указывает описание напитка.
 * 13. Administrator устанавливает цену размера M.
 * 14. Administrator сохраняет напиток.
 * 15. Administrator открывает управление группами добавок.
 * 16. Administrator начинает создание группы добавок.
 * 17. Administrator указывает название группы добавок.
 * 18. Administrator делает выбор обязательным.
 * 19. Administrator выбирает одиночный тип группы.
 * 20. Administrator добавляет вариант добавки.
 * 21. Administrator указывает название добавки.
 * 22. Administrator устанавливает нулевую цену добавки.
 * 23. Administrator выбирает добавку по умолчанию.
 * 24. Administrator сохраняет группу добавок.
 * 25. Administrator открывает назначения категории.
 * 26. Administrator выбирает группу добавок категории.
 * 27. Administrator сохраняет назначения категории.
 * 28. Administrator выходит из back-office.
 * 29. Customer открывает публичное меню.
 * 30. Customer открывает категорию.
 * 31. Customer открывает напиток.
 * 32. Customer выбирает размер M.
 * 33. Customer выбирает обязательную добавку.
 * 34. Customer добавляет напиток в корзину.
 * 35. Customer открывает корзину.
 * 36. Customer устанавливает количество два.
 * 37. Customer начинает оформление заказа.
 * 38. Customer указывает номер телефона.
 * 39. Customer запрашивает одноразовый код.
 * 40. Customer указывает одноразовый код.
 * 41. Customer подтверждает номер телефона.
 * 42. Customer указывает имя при первой регистрации.
 * 43. Customer подтверждает оформление заказа.
 * 44. Customer читает созданный заказ.
 * 45. Staff открывает back-office.
 * 46. Staff входит в back-office.
 * 47. Staff ожидает загрузки очереди.
 * 48. Staff открывает детали оформленного заказа.
 * 49. Staff принимает заказ.
 * 50. Staff начинает приготовление заказа.
 * 51. Staff отмечает заказ готовым.
 * 52. После внешней оплаты customer staff выдаёт заказ.
 * 53. Staff выходит из back-office.
 * 54. Customer открывает front-office.
 * 55. Customer указывает номер телефона.
 * 56. Customer запрашивает одноразовый код.
 * 57. Customer указывает одноразовый код.
 * 58. Customer подтверждает номер телефона.
 * 59. Customer указывает имя при первой регистрации.
 * 60. Customer открывает историю заказов.
 * 61. Customer обновляет историю заказов.
 * 62. Customer открывает выданный заказ.
 *
 * Ожидаемый результат:
 * - История и детали показывают выданный заказ с неизменяемыми составом и итогом.
 */
test("JOURNEY-04: customer открывает выданный заказ в истории", async ({
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
    await test.step("Результат: история и детали показывают выданный заказ с сохранённым составом и итогом.", async () => {
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
    await menuManagement.catalog.expandCategory(data.categoryName);
    await menuManagement.productEditor.archive(data.productName);
    await menuManagement.modifierGroupEditor.archive(data.modifierGroupName);
    await menuManagement.categoryEditor.archive(data.categoryName);
    await menuManagement.catalog.assertScenarioAbsent(data);
  }
});
