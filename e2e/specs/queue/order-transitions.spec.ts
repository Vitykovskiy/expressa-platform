import {
  createProductOrderScenarioData,
  expect,
  ModifierSelectionType,
  OrderQueueStage,
  OrderQueueTransitionAction,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  QueueScenarioStage,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник проводит заказ только по разрешённой последовательности стадий до выдачи.
 *
 * Предусловия: administrator, staff и customer могут войти в свои интерфейсы;
 * customer может подтвердить номер телефона.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник открывает детали оформленного заказа.
 * 3. Сотрудник переводит заказ из стадии «Оформлен» в «Принят».
 * 4. Сотрудник переводит заказ из стадии «Принят» в «Готовится».
 * 5. Сотрудник переводит заказ из стадии «Готовится» в «Готов».
 * 6. Сотрудник получает наличную оплату и нажимает «Выдать» для перевода заказа из стадии «Готов» в «Выдан».
 *
 * Ожидаемый результат:
 * - После каждого действия карточка и детали показывают следующую разрешённую стадию: «Принят», «Готовится», «Готов», «Выдан».
 * - Для оформленного заказа доступен только переход в «Принят»; переходы с пропуском стадии недоступны.
 * - После выдачи действие следующего или повторного перехода не показано.
 * - История фиксирует каждый переход с его автором и временем.
 * - «Выдать» подтверждает наличную оплату и не создаёт отдельную стадию заказа.
 */
test("QUEUE-07: сотрудник проводит заказ по разрешённым стадиям", async ({
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

  try {
    const order =
      await test.step("Подготовка: administrator публикует товар, а customer оформляет заказ через UI.", async () => {
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
        await menuManagement.productEditor.fillDescription(
          data.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          data.productPrice,
        );
        await menuManagement.productEditor.save(data.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          data.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          data.modifierName,
        );
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
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(data.customerName);
        await checkout.cart.placeOrder();

        return customerOrder.details.readSnapshot();
      });
    await test.step("Подготовка: staff входит в back-office.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.staff);
    });

    await staffOrders.open();
    await staffOrders.queue.openDetails(order);
    const initialTransitions =
      await staffOrders.queue.readAvailableTransitions(order);
    await staffOrders.queue.transition(
      order,
      OrderQueueTransitionAction.ACCEPT,
    );
    const acceptedStage = await staffOrders.queue.readCurrentStage(order);
    const acceptedTransitions =
      await staffOrders.queue.readAvailableTransitions(order);
    await staffOrders.queue.transition(
      order,
      OrderQueueTransitionAction.START_PREPARING,
    );
    const preparingStage = await staffOrders.queue.readCurrentStage(order);
    const preparingTransitions =
      await staffOrders.queue.readAvailableTransitions(order);
    await staffOrders.queue.transition(
      order,
      OrderQueueTransitionAction.MARK_READY,
    );
    const readyStage = await staffOrders.queue.readCurrentStage(order);
    const readyTransitions =
      await staffOrders.queue.readAvailableTransitions(order);
    await staffOrders.queue.transition(order, OrderQueueTransitionAction.ISSUE);
    const issuedStage = await staffOrders.queue.readCurrentStage(order);
    const issuedTransitions =
      await staffOrders.queue.readAvailableTransitions(order);
    const history = await staffOrders.queue.readTransitionHistory(order);

    await test.step("После каждого действия карточка и детали показывают следующую разрешённую стадию: «Принят», «Готовится», «Готов», «Выдан».", async () => {
      expect(acceptedStage, "После принятия заказ показан как «Принят».").toBe(
        OrderQueueStage.ACCEPTED,
      );
      expect(
        acceptedTransitions,
        "В деталях принятого заказа доступно начало приготовления.",
      ).toEqual([OrderQueueTransitionAction.START_PREPARING]);
      expect(
        preparingStage,
        "После начала приготовления заказ показан как «Готовится».",
      ).toBe(OrderQueueStage.PREPARING);
      expect(
        preparingTransitions,
        "В деталях готовящегося заказа доступно завершение приготовления.",
      ).toEqual([OrderQueueTransitionAction.MARK_READY]);
      expect(readyStage, "После приготовления заказ показан как «Готов».").toBe(
        OrderQueueStage.READY,
      );
      expect(
        readyTransitions,
        "В деталях готового заказа доступна выдача.",
      ).toEqual([OrderQueueTransitionAction.ISSUE]);
      expect(issuedStage, "После выдачи заказ показан как «Выдан».").toBe(
        OrderQueueStage.ISSUED,
      );
      expect(
        issuedTransitions,
        "В деталях выданного заказа действие перехода отсутствует.",
      ).toEqual([]);
    });
    await test.step("Для оформленного заказа доступен только переход в «Принят»; переходы с пропуском стадии недоступны.", async () => {
      expect(
        initialTransitions,
        "Для оформленного заказа доступно только действие «Принять заказ».",
      ).toEqual([OrderQueueTransitionAction.ACCEPT]);
    });
    await test.step("После выдачи действие следующего или повторного перехода не показано.", async () => {
      expect(
        issuedTransitions,
        "После выдачи действие следующего или повторного перехода отсутствует.",
      ).toEqual([]);
    });
    await test.step("История фиксирует каждый переход с его автором и временем.", async () => {
      expect(history, "История содержит четыре перехода.").toHaveLength(4);
      expect(
        history[0],
        "История начинается с «Оформлен» → «Принят».",
      ).toMatchObject({
        from: QueueScenarioStage.CREATED,
        to: OrderQueueStage.ACCEPTED,
      });
      expect(
        history[1],
        "История фиксирует «Принят» → «Готовится».",
      ).toMatchObject({
        from: OrderQueueStage.ACCEPTED,
        to: OrderQueueStage.PREPARING,
      });
      expect(
        history[2],
        "История фиксирует «Готовится» → «Готов».",
      ).toMatchObject({
        from: OrderQueueStage.PREPARING,
        to: QueueScenarioStage.READY,
      });
      expect(
        history[3],
        "История завершает путь «Готов» → «Выдан».",
      ).toMatchObject({
        from: QueueScenarioStage.READY,
        to: OrderQueueStage.ISSUED,
      });
      for (const [index, transition] of history.entries()) {
        expect(
          transition.author,
          `Автор перехода ${index + 1} показан.`,
        ).not.toBe("");
        expect(
          transition.occurredAt,
          `Время перехода ${index + 1} показано.`,
        ).not.toBe("");
      }
    });
    await test.step("«Выдать» подтверждает наличную оплату и не создаёт отдельную стадию заказа.", async () => {
      expect(
        readyTransitions,
        "Перед выдачей показано действие «Выдать заказ» для наличной оплаты.",
      ).toEqual([OrderQueueTransitionAction.ISSUE]);
      expect(
        history[3],
        "Выдача переводит готовый заказ непосредственно в стадию «Выдан».",
      ).toMatchObject({
        from: QueueScenarioStage.READY,
        to: OrderQueueStage.ISSUED,
      });
      expect(issuedStage, "После подтверждения оплаты заказ выдан.").toBe(
        OrderQueueStage.ISSUED,
      );
      expect(
        issuedTransitions,
        "После выдачи повторное действие не показано.",
      ).toEqual([]);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные позиции каталога через UI.", async () => {
      await backOfficeAuth.form.signOut();
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(data.productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        data.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
