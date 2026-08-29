import {
  expect,
  ModifierSelectionType,
  OrderHistoryStatus,
  OrderQueueStage,
  OrderStatus,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: проверить путь от публикации напитка до истории выданного заказа.
 *
 * Предусловия: в тестовом окружении доступны роли администратора, сотрудника и клиента с одноразовыми кодами; изолированный профиль предоставляет уникальный идентификатор сценария.
 *
 * Сценарий:
 * 1. Администратор открывает административное приложение.
 * 1.1. Администратор указывает номер телефона.
 * 1.2. Администратор запрашивает одноразовый код.
 * 1.3. Администратор указывает одноразовый код.
 * 1.4. Администратор подтверждает номер телефона.
 * 2. Администратор открывает управление меню.
 * 3. Администратор начинает создание категории.
 * 4. Администратор указывает название категории.
 * 5. Администратор указывает описание категории.
 * 6. Администратор сохраняет категорию.
 * 7. Администратор начинает создание напитка.
 * 8. Администратор выбирает категорию напитка.
 * 9. Администратор выбирает тип напитка.
 * 10. Администратор указывает название напитка.
 * 11. Администратор указывает описание напитка.
 * 12. Администратор оставляет единственный размер M.
 * 12.1. Администратор устанавливает цену размера M.
 * 13. Администратор сохраняет напиток.
 * 14. Администратор открывает управление группами добавок.
 * 15. Администратор начинает создание группы добавок.
 * 16. Администратор указывает название группы добавок.
 * 17. Администратор делает выбор обязательным.
 * 18. Администратор выбирает одиночный тип группы.
 * 19. Администратор добавляет вариант добавки.
 * 20. Администратор указывает название добавки.
 * 21. Администратор устанавливает нулевую цену добавки.
 * 22. Администратор выбирает добавку по умолчанию.
 * 23. Администратор сохраняет группу добавок.
 * 24. Администратор открывает назначения категории.
 * 25. Администратор выбирает группу добавок категории.
 * 26. Администратор сохраняет назначения категории.
 * 26.1. Администратор выходит из административного приложения.
 * 27. Клиент открывает публичное меню.
 * 28. Клиент открывает категорию.
 * 29. Клиент открывает напиток.
 * 30. Клиент выбирает размер M.
 * 31. Клиент выбирает обязательную добавку.
 * 32. Клиент добавляет напиток в корзину.
 * 33. Клиент открывает корзину.
 * 34. Клиент устанавливает количество два.
 * 35. Клиент начинает оформление заказа.
 * 36. Клиент указывает номер телефона.
 * 37. Клиент запрашивает одноразовый код.
 * 38. Клиент указывает одноразовый код.
 * 39. Клиент подтверждает номер телефона.
 * 40. Клиент указывает имя при первой регистрации.
 * 41. Клиент подтверждает оформление заказа.
 * 42. Клиент читает созданный заказ.
 * 43. Сотрудник открывает административное приложение.
 * 43.1. Сотрудник указывает номер телефона.
 * 43.2. Сотрудник запрашивает одноразовый код.
 * 43.3. Сотрудник указывает одноразовый код.
 * 43.4. Сотрудник подтверждает номер телефона.
 * 44. Сотрудник ожидает загрузки очереди.
 * 45. Сотрудник открывает детали оформленного заказа.
 * 46. Сотрудник принимает заказ.
 * 47. Сотрудник начинает приготовление заказа.
 * 48. Сотрудник отмечает заказ готовым.
 * 49. Сотрудник выдаёт заказ.
 * 49.1. Сотрудник выходит из административного приложения.
 * 50. Клиент открывает клиентское приложение.
 * 51. Клиент указывает номер телефона.
 * 52. Клиент запрашивает одноразовый код.
 * 53. Клиент указывает одноразовый код.
 * 54. Клиент подтверждает номер телефона.
 * 55. Клиент открывает историю заказов.
 * 56. Клиент обновляет историю заказов.
 * 57. Клиент открывает выданный заказ.
 *
 * Ожидаемый результат:
 * - Опубликованный напиток доступен клиенту.
 * - Создан оформленный заказ с выбранным составом.
 * - Заказ принят.
 * - Заказ готовится.
 * - Заказ готов.
 * - Заказ выдан.
 * - История показывает неизменяемый выданный заказ.
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
  await test.step("Результат: опубликованный напиток доступен клиенту.", async () => {
    const [name, price, size, modifierName] = await Promise.all([
      publicMenu.product.readOpenedProductTitle(),
      publicMenu.product.readProductPrice(),
      publicMenu.product.readSelectedSize(),
      publicMenu.product.readSelectedRequiredModifier(data.modifierGroupName),
    ]);

    expect(name, "Открыт опубликованный напиток.").toBe(data.productName);
    expect(price, "Цена напитка опубликована.").toBe("199 ₽");
    expect(size, "Доступен размер M.").toBe(ProductConfiguratorSize.M);
    expect(modifierName, "Выбрана обязательная добавка.").toBe(
      data.modifierName,
    );
  });
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
  await test.step("Результат: создан оформленный заказ с выбранным составом.", async () => {
    expect(snapshot.status, "Заказ оформлен.").toBe(OrderStatus.CREATED);
    expect(snapshot.productName, "Напиток сохранён в заказе.").toBe(
      data.productName,
    );
    expect(snapshot.quantity, "Количество сохранено в заказе.").toContain(
      String(data.productQuantity),
    );
    expect(snapshot.total, "Итог сохранён в заказе.").toBe("398 ₽");
  });
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
  await test.step("Результат: заказ принят.", async () => {
    expect(
      await staffOrders.queue.readCurrentStage(snapshot),
      "Заказ принят.",
    ).toBe(OrderQueueStage.ACCEPTED);
  });
  await staffOrders.queue.transition(
    snapshot,
    OrderQueueTransitionAction.START_PREPARING,
  );
  await test.step("Результат: заказ готовится.", async () => {
    expect(
      await staffOrders.queue.readCurrentStage(snapshot),
      "Заказ готовится.",
    ).toBe(OrderQueueStage.PREPARING);
  });
  await staffOrders.queue.transition(
    snapshot,
    OrderQueueTransitionAction.MARK_READY,
  );
  await test.step("Результат: заказ готов.", async () => {
    expect(
      await staffOrders.queue.readCurrentStage(snapshot),
      "Заказ готов.",
    ).toBe(OrderQueueStage.READY);
  });
  await staffOrders.queue.transition(
    snapshot,
    OrderQueueTransitionAction.ISSUE,
  );
  await test.step("Результат: заказ выдан.", async () => {
    expect(
      await staffOrders.queue.readCurrentStage(snapshot),
      "Заказ выдан.",
    ).toBe(OrderQueueStage.ISSUED);
  });
  await backOfficeAuth.form.signOut();
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirm();
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
    expect(historyOrder.total, "Итог в истории сохранён.").toBe(snapshot.total);
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
