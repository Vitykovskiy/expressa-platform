import {
  expect,
  ModifierSelectionType,
  OrderHistoryStatus,
  OrderStatus,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: клиент видит выданный заказ с сохранённым составом в истории.
 *
 * Предусловия: в тестовом окружении доступны роли администратора, сотрудника и клиента с одноразовыми кодами; изолированный профиль предоставляет уникальный идентификатор сценария.
 *
 * Сценарий:
 * 1. Администратор открывает административное приложение.
 * 2. Администратор указывает номер телефона.
 * 2.1. Администратор запрашивает одноразовый код.
 * 2.2. Администратор указывает одноразовый код.
 * 2.3. Администратор подтверждает номер телефона.
 * 3. Администратор открывает управление меню.
 * 4. Администратор начинает создание категории.
 * 5. Администратор указывает название категории.
 * 6. Администратор указывает описание категории.
 * 7. Администратор сохраняет категорию.
 * 8. Администратор начинает создание напитка.
 * 9. Администратор выбирает категорию напитка.
 * 10. Администратор выбирает тип напитка.
 * 11. Администратор указывает название напитка.
 * 12. Администратор указывает описание напитка.
 * 13. Администратор оставляет единственный размер M.
 * 13.1. Администратор устанавливает цену размера M.
 * 14. Администратор сохраняет напиток.
 * 15. Администратор открывает управление группами добавок.
 * 16. Администратор начинает создание группы добавок.
 * 17. Администратор указывает название группы добавок.
 * 18. Администратор делает выбор обязательным.
 * 19. Администратор выбирает одиночный тип группы.
 * 20. Администратор добавляет вариант добавки.
 * 21. Администратор указывает название добавки.
 * 22. Администратор устанавливает нулевую цену добавки.
 * 23. Администратор выбирает добавку по умолчанию.
 * 24. Администратор сохраняет группу добавок.
 * 25. Администратор открывает назначения категории.
 * 26. Администратор выбирает группу добавок категории.
 * 27. Администратор сохраняет назначения категории.
 * 28. Администратор выходит из административного приложения.
 * 29. Клиент открывает публичное меню.
 * 30. Клиент открывает категорию.
 * 31. Клиент открывает напиток.
 * 32. Клиент выбирает размер M.
 * 33. Клиент выбирает обязательную добавку.
 * 34. Клиент добавляет напиток в корзину.
 * 35. Клиент открывает корзину.
 * 36. Клиент устанавливает количество два.
 * 37. Клиент начинает оформление заказа.
 * 38. Клиент указывает номер телефона.
 * 39. Клиент запрашивает одноразовый код.
 * 40. Клиент указывает одноразовый код.
 * 41. Клиент подтверждает номер телефона.
 * 42. Клиент указывает имя при первой регистрации.
 * 43. Клиент подтверждает оформление заказа.
 * 44. Клиент читает созданный заказ.
 * 45. Сотрудник открывает административное приложение.
 * 46. Сотрудник указывает номер телефона.
 * 46.1. Сотрудник запрашивает одноразовый код.
 * 46.2. Сотрудник указывает одноразовый код.
 * 46.3. Сотрудник подтверждает номер телефона.
 * 47. Сотрудник ожидает загрузки очереди.
 * 48. Сотрудник открывает детали оформленного заказа.
 * 49. Сотрудник принимает заказ.
 * 50. Сотрудник начинает приготовление заказа.
 * 51. Сотрудник отмечает заказ готовым.
 * 52. Сотрудник выдаёт заказ.
 * 53. Сотрудник выходит из административного приложения.
 * 54. Клиент открывает клиентское приложение.
 * 55. Клиент указывает номер телефона.
 * 56. Клиент запрашивает одноразовый код.
 * 57. Клиент указывает одноразовый код.
 * 58. Клиент подтверждает номер телефона.
 * 59. Клиент открывает историю заказов.
 * 60. Клиент обновляет историю заказов.
 * 61. Клиент открывает выданный заказ.
 *
 * Ожидаемый результат:
 * - История показывает выданный заказ с датой и итогом.
 * - Детали сохраняют состав и итог выданного заказа.
 */
test("JOURNEY-04: клиент открывает выданный заказ в истории", async ({
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

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
  await backOfficeAuth.form.confirmCode();
  await menuManagement.open();
  await menuManagement.categoryEditor.startCreation();
  await menuManagement.categoryEditor.fillName(data.categoryName);
  await menuManagement.categoryEditor.fillDescription(data.productDescription);
  await menuManagement.categoryEditor.save(data.categoryName);
  await menuManagement.productEditor.startCreation();
  await menuManagement.productEditor.selectCategory(data.categoryName);
  await menuManagement.productEditor.selectType(ProductType.DRINK);
  await menuManagement.productEditor.fillName(data.productName);
  await menuManagement.productEditor.fillDescription(data.productDescription);
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
  await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
  await backOfficeAuth.form.confirmCode();
  await staffOrders.queue.waitReady();
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
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirm();
  await orderHistory.open();
  await orderHistory.history.refresh();
  const historyOrder = await orderHistory.history.readOrder(snapshot);
  await orderHistory.history.openOrder(snapshot);
  const issuedOrder = await customerOrder.details.readSnapshot();

  await test.step("Результат: история показывает выданный заказ с датой и итогом.", async () => {
    expect(historyOrder.number, "Номер заказа сохранён в истории.").toBe(
      snapshot.number,
    );
    expect(historyOrder.status, "В истории показана стадия «Выдан».").toBe(
      OrderHistoryStatus.ISSUED,
    );
    expect(historyOrder.total, "Итог в истории сохранён.").toBe(snapshot.total);
    expect(
      historyOrder.displayedDate,
      "Дата заказа показана в истории.",
    ).not.toBe("");
  });
  await test.step("Результат: детали сохраняют состав и итог выданного заказа.", async () => {
    expect(issuedOrder.productName, "Наименование товара не изменилось.").toBe(
      snapshot.productName,
    );
    expect(issuedOrder.size, "Размер товара не изменился.").toBe(snapshot.size);
    expect(issuedOrder.modifierName, "Добавка не изменилась.").toBe(
      snapshot.modifierName,
    );
    expect(issuedOrder.quantity, "Количество товара не изменилось.").toBe(
      snapshot.quantity,
    );
    expect(issuedOrder.total, "Итог в деталях сохранён.").toBe(snapshot.total);
    expect(issuedOrder.status, "В деталях показана стадия «Выдан».").toBe(
      OrderStatus.ISSUED,
    );
  });
});
