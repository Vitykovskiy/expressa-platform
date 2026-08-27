import {
  expect,
  ModifierSelectionType,
  OrderStatus,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: customer оформляет заказ опубликованного напитка через корзину и OTP.
 *
 * Предусловия: сценарий публикует уникальный напиток с обязательной добавкой; customer может получить OTP.
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
 *
 * Ожидаемый результат:
 * - Создан заказ со стадией «Заказ принят» и сохранёнными составом, количеством и итогом корзины.
 */
test("JOURNEY-02: customer оформляет заказ через OTP", async ({
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
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
    await test.step("Результат: созданный заказ содержит идентификатор, состав, количество, итог и стадию.", async () => {
      const snapshot = await customerOrder.details.readSnapshot();

      expect(snapshot.id, "Созданный заказ имеет идентификатор.").not.toBe("");
      expect(snapshot.number, "Созданный заказ имеет номер.").not.toBe("");
      expect(snapshot.productName, "Наименование товара сохранено.").toBe(
        data.productName,
      );
      expect(snapshot.size, "Выбранный размер сохранён.").toBe(
        `Размер ${data.productSize}`,
      );
      expect(snapshot.modifierName, "Обязательная добавка сохранена.").toBe(
        `+ ${data.modifierName}`,
      );
      expect(snapshot.quantity, "Количество товара сохранено.").toContain(
        String(data.productQuantity),
      );
      expect(snapshot.total, "Итог заказа сохранён.").toContain("3,98");
      expect(snapshot.status, "Созданный заказ принят.").toBe(
        OrderStatus.CREATED,
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
