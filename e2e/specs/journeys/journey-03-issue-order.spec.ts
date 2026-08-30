import {
  expectedResult,
  expect,
  ModifierSelectionType,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  OrderQueueStage,
  OrderQueueTransitionAction,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: сотрудник переводит оформленный заказ до выдачи через интерфейс.
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
 * 52. Сотрудник выдаёт готовый заказ.
 *
 * Ожидаемый результат:
 * - Заказ принят.
 * - Заказ готовится.
 * - Готовый заказ доступен для выдачи.
 * - Готовый заказ выдан, а история содержит четыре перехода с автором и временем.
 */
test("JOURNEY-03: сотрудник выдаёт готовый заказ", async ({
  page,
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
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
  await expectedResult("Результат: заказ принят.", page, async () => {
    const stage = await staffOrders.queue.readCurrentStage(snapshot);

    expect(stage, "В карточке показана стадия «Принят».").toBe(
      OrderQueueStage.ACCEPTED,
    );
  });
  await staffOrders.queue.transition(
    snapshot,
    OrderQueueTransitionAction.START_PREPARING,
  );
  await expectedResult("Результат: заказ готовится.", page, async () => {
    const stage = await staffOrders.queue.readCurrentStage(snapshot);

    expect(stage, "В карточке показана стадия «Готовится».").toBe(
      OrderQueueStage.PREPARING,
    );
  });
  await staffOrders.queue.transition(
    snapshot,
    OrderQueueTransitionAction.MARK_READY,
  );
  await expectedResult(
    "Результат: готовый заказ доступен для выдачи.",
    page,
    async () => {
      const [stage, actions] = await Promise.all([
        staffOrders.queue.readCurrentStage(snapshot),
        staffOrders.queue.readAvailableTransitions(snapshot),
      ]);

      expect(stage, "В карточке показана стадия «Готов».").toBe(
        OrderQueueStage.READY,
      );
      expect(actions, "Выдача доступна после готовности.").toContain(
        OrderQueueTransitionAction.ISSUE,
      );
    },
  );
  await staffOrders.queue.transition(
    snapshot,
    OrderQueueTransitionAction.ISSUE,
  );
  await expectedResult(
    "Результат: готовый заказ выдан, а история содержит четыре перехода с автором и временем.",
    page,
    async () => {
      const stage = await staffOrders.queue.readCurrentStage(snapshot);
      const transitions =
        await staffOrders.queue.readTransitionHistory(snapshot);

      expect(stage, "Текущая стадия заказа — «Выдан».").toBe(
        OrderQueueStage.ISSUED,
      );
      expect(transitions, "История содержит четыре перехода.").toHaveLength(4);
      const expectedTransitions = [
        [OrderQueueStage.CREATED, OrderQueueStage.ACCEPTED],
        [OrderQueueStage.ACCEPTED, OrderQueueStage.PREPARING],
        [OrderQueueStage.PREPARING, OrderQueueStage.READY],
        [OrderQueueStage.READY, OrderQueueStage.ISSUED],
      ] as const;

      for (const [index, [from, to]] of expectedTransitions.entries()) {
        const transition = transitions[index];

        expect(
          transition?.from,
          `Показана исходная стадия перехода ${index + 1}.`,
        ).toBe(from);
        expect(
          transition?.to,
          `Показана новая стадия перехода ${index + 1}.`,
        ).toBe(to);
        expect(transition?.author, `Показан автор перехода ${index + 1}.`).toBe(
          e2eCredentials.staff.phone,
        );
        expect(
          transition?.occurredAt,
          `Показаны допустимые дата и время перехода ${index + 1}.`,
        ).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/u);
      }
    },
  );
});
