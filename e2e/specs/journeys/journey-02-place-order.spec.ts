import {
  expectedResult,
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
 * Назначение: клиент оформляет заказ опубликованного напитка через корзину и одноразовый код.
 *
 * Предусловия: в тестовом окружении доступны роли администратора и клиента с одноразовыми кодами; изолированный профиль предоставляет уникальный идентификатор сценария.
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
 *
 * Ожидаемый результат:
 * - После подтверждения телефона корзина сохраняет конфигурацию и количество.
 * - Создан заказ со стадией «Оформлен».
 * - Страница заказа показывает сохранённый состав и итог.
 */
test("JOURNEY-02: клиент оформляет заказ через одноразовый код", async ({
  page,
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
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
  await expectedResult(
    "Результат: после подтверждения телефона корзина сохраняет конфигурацию и количество.",
    page,
    async () => {
      const [name, size, modifiers, quantity] = await Promise.all([
        checkout.cart.readItemName(data.productName),
        checkout.cart.readItemVariant(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        checkout.cart.readItemModifiers(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
      ]);

      expect(name, "Товар сохранён в корзине.").toBe(data.productName);
      expect(size, "Размер сохранён в корзине.").toBe("Размер M");
      expect(modifiers, "Добавка сохранена в корзине.").toEqual([
        `+ ${data.modifierName}`,
      ]);
      expect(quantity, "Количество сохранено в корзине.").toBe(
        data.productQuantity,
      );
    },
  );
  await checkout.profile.completeProfileIfShown(data.customerName);
  await checkout.cart.placeOrder();
  const snapshot = await customerOrder.details.readSnapshot();

  await expectedResult(
    "Результат: создан заказ со стадией «Оформлен».",
    page,
    async () => {
      expect(snapshot.id, "Созданный заказ имеет идентификатор.").not.toBe("");
      expect(snapshot.number, "Созданный заказ имеет номер.").not.toBe("");
      expect(snapshot.status, "Созданный заказ оформлен.").toBe(
        OrderStatus.CREATED,
      );
    },
  );
  await expectedResult(
    "Результат: страница заказа показывает сохранённый состав и итог.",
    page,
    async () => {
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
      expect(snapshot.total, "Итог заказа сохранён.").toBe("398 ₽");
    },
  );
});
