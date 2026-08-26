---
title: Code Style для standalone E2E
description: Соглашения Playwright, TypeScript и POM для E2E-набора Expressa.
type: convention
area: e2e
status: active
tags: [code-style, e2e, playwright, typescript]
related:
  - Definition-of-Done.md
  - ../20-architecture/ADR/ADR-001-standalone-e2e-architecture.md
---

# Code Style для standalone E2E

Этот документ — нормативный источник для Playwright-спецификаций, Page и Component Objects, fixtures, тестовых данных и вспомогательных модулей в `e2e`. UI-only границу задаёт [ADR-001](../20-architecture/ADR/ADR-001-standalone-e2e-architecture.md).

## Роли файлов

- Spec владеет пользовательским сценарием и межэкранными проверками.
- Domain Page — тонкий корень композиции экрана: открывает экран, проверяет его готовность и предоставляет его устойчивые области.
- Component Object представляет устойчивую область экрана и владеет её локаторами, ожиданиями готовности и атомарными UI-действиями.
- Fixture собирает зависимости сценария, не дублируя UI-механику.
- `support/data` хранит предметные данные и генераторы, `support/config` — чтение и проверку E2E-окружения. Имя файла, типа и фабрики данных описывает предметный сценарий (`product-order-scenario-data`, `ProductOrderScenarioData`), а не номер эпика, этап качества или технический префикс.
- Взаимодействие с приложением выполняется только через UI Playwright. API, БД, Web Storage, прямое изменение сети и иной обход интерфейса не используются.

## Структура и TypeScript

- Используется строгий TypeScript; `any` не применяется. Публичные входы, результаты чтения и предметные данные типизируются явно.
- Page живёт в `pages/<office>/<area>/<page-name>/`. Local Component Object, используемый только этим Page, живёт внутри его каталога. Page не повторяет действия своих компонентов и не содержит workflow нескольких областей; local Component не управляет другим экраном и не содержит предметных правил приложения.
- `components/<office>/<area>/` содержит только Shared Component Object, который используют минимум два разных Page Objects. Пока второго Page-потребителя нет, Component остаётся local внутри Page-владельца.
- `*.constants.ts` и `*.types.ts` принадлежат одному конкретному Page либо Component Object, лежат в каталоге владельца и имеют с ним одинаковое базовое имя. Каждый именованный module-scope `const`, задающий статический UI-контракт или конфигурацию владельца, выносится в `<owner>.constants.ts`, а каждый именованный module-scope `type` или `interface` владельца — в `<owner>.types.ts`, независимо от `export` и повторного использования. В частности, `currencyFormatter`, `orderHeadingPattern` и `orderIdPattern` — константы владельца. Локальные переменные, параметры методов, private Locator-поля и иные детали, не являющиеся module-scope UI- или config-контрактом, остаются в классе. Общие предметные контракты не копируются между владельцами.
- Межкаталожные импорты используют только aliases `@pages/*`, `@components/*`, `@fixtures/*`, `@support/*`. Относительные импорты допустимы только внутри одного каталога владельца. Barrel-файлы и отдельный runtime resolver не создаются.

```text
e2e/
├── pages/<office>/<area>/<page-name>/
│   ├── <page-name>.page.ts
│   ├── <page-name>.constants.ts  # опционально
│   ├── <page-name>.types.ts      # опционально
│   └── <local-component-name>/
│       ├── <local-component-name>.component.ts
│       ├── <local-component-name>.constants.ts  # опционально
│       └── <local-component-name>.types.ts      # опционально
├── components/<office>/<area>/<component-name>/
│   ├── <component-name>.component.ts
│   ├── <component-name>.constants.ts  # опционально
│   └── <component-name>.types.ts      # опционально
├── fixtures/test.ts
├── specs/<area>/<scenario>.spec.ts
└── support/{config,data}/
```

## Спецификации и объекты

- Имена сценариев, `test.step` и UI-ассерты пишутся по-русски и описывают наблюдаемое пользовательское поведение.
- Перед каждым `test` размещается JSDoc ровно с четырьмя разделами: `Назначение`, `Предусловия`, `Сценарий`, `Ожидаемый результат`. Другие разделы в JSDoc не создаются.
- `Назначение` называет одну проверяемую бизнес-цель. `Предусловия` содержат только существующие до сценария условия доступа и данные. `Ожидаемый результат` формулирует конечное предметное состояние.
- `Сценарий` — нумерованный список атомарных предметных действий пользователей в фактическом порядке. Один пункт изменяет одно значение, выбирает одну предметную опцию, запускает создание одного объекта либо сохраняет один объект. Перечисление нескольких вводов, выборов или сохранения в одном пункте запрещено. Каждый пункт точно называет объект и значение: тип товара, наименование, описание, конкретный вариант, добавку, количество или состояние. Пункт не описывает кнопку, клик, локатор, ожидание, URL, toast или метод объекта.
- Каждый нумерованный пункт `Сценария` соответствует ровно одному прямому вызову публичного действия Page/Component Object в spec и находится с ним в том же порядке. Один публичный метод не реализует несколько пунктов сценария; такой workflow разделяется на самостоятельные действия владельцев UI-областей.
- `Ожидаемый результат` перечисляет отдельными пунктами смысловые контрольные точки test. Каждая контрольная точка имеет один одноимённый русскоязычный business-level `test.step` в spec и идёт в том же порядке.
- Business-level `test.step` объединяет проверки одного предметного состояния: например, состава корзины, созданного заказа, перехода статуса или результата очистки. Он не создаётся отдельно для каждого поля и не используется как wrapper над действием Page/Component Object без собственной предметной проверки.
- Внутри business-level `test.step` каждое независимо проверяемое значение имеет отдельный `expect` с собственным сообщением. Наименование, вариант, добавки, количество, цена, итог и статус не скрываются в одном общем assertion или assertion-методе.
- Page/Component Object владеет локаторами, кликами, готовностью экрана и вложенным `test.step` атомарного UI-действия. Внутри action-step находится web-first `expect` его непосредственного видимого результата.
- Spec вызывает действия Page/Component Objects напрямую и владеет предметными проверками. Межэкранные сравнения — например, созданного заказа с заказом в истории, состава, количества, итога и статуса — также принадлежат spec.
- Spec вызывает предметные методы Page/Component Objects. Он не создаёт локаторы, не повторяет ожидания готовности и не содержит технические клики, уже инкапсулированные объектом.
- Стабильные локаторы — приватные поля класса. Параметризованный элемент выражается приватной фабрикой `item(name): Locator`; наружу локаторы не передаются.
- Сначала используются роль с доступным именем, подпись или стабильный `id`. `data-testid` — минимальный контракт для структурной части интерфейса, которую нельзя выбрать семантически (например, итог строки или корень повторяемой карточки).
- Нельзя строить контракт на CSS-классах, HTML-тегах, `.first()`, `.last()`, `nth()` или порядке DOM.
- UI-действие ожидает наблюдаемый результат через web-first `expect`. Фиксированные задержки не используются.
- Объект представляет экран, устойчивую область экрана либо переиспользуемый компонент. Он не содержит бизнес-правила приложения, подготовку через API и логику другого экрана.
- Импорты разделяются пустой строкой: сначала внешние модули, затем внутренние значения, затем `type`-импорты. В классе пустыми строками разделяются публичная композиция, приватные локаторы, конструктор, публичные действия и приватные фабрики. Форматтер не заменяет эту структуру.
- Запрещены `test.only`, `test.skip`, `describe.only`, отладочные паузы и временные обходы без отдельного назначения.

### Контракт сценария

Каждый атомарный `test` проверяет одну бизнес-цель. Подготовка делает доступным
состояние для цели, а cleanup убирает созданные данные; они не становятся целью
или нумерованным пунктом сценария. Сквозной путь допускается отдельным
`full journey`-test: он проверяет связку атомарных возможностей и не заменяет их.

JSDoc и business-level шаги показывают бизнес-путь в исходном коде и отчёте
Playwright. Вложенные шаги компонентов помогают найти сломанное UI-действие, но
не являются заменой шага сценария.

```ts
/**
 * Назначение: покупатель оформляет один опубликованный товар с обязательной добавкой.
 *
 * Предусловия: администратор и покупатель могут войти в свои интерфейсы;
 * покупателю доступно подтверждение номера.
 *
 * Сценарий:
 * 1. Администратор начинает создание категории.
 * 2. Администратор указывает уникальное наименование категории.
 * 3. Администратор указывает описание категории.
 * 4. Администратор сохраняет категорию.
 * 5. Администратор начинает создание товара.
 * 6. Администратор выбирает для товара созданную категорию.
 * 7. Администратор выбирает тип товара «Напиток».
 * 8. Администратор указывает уникальное наименование товара.
 * 9. Администратор указывает описание товара.
 * 10. Администратор устанавливает цену товара размера S.
 * 11. Администратор устанавливает цену товара размера M.
 * 12. Администратор устанавливает цену товара размера L.
 * 13. Администратор сохраняет товар.
 * 14. Администратор начинает создание группы добавок.
 * 15. Администратор указывает уникальное наименование группы добавок.
 * 16. Администратор добавляет в группу новую добавку.
 * 17. Администратор указывает уникальное наименование добавки.
 * 18. Администратор устанавливает нулевую цену добавки.
 * 19. Администратор сохраняет группу добавок.
 * 20. Администратор открывает назначения добавок созданной категории.
 * 21. Администратор выбирает созданную группу добавок для категории.
 * 22. Администратор сохраняет назначения категории.
 * 23. Покупатель открывает в публичном меню созданную категорию.
 * 24. Покупатель открывает созданный товар.
 * 25. Покупатель выбирает размер M.
 * 26. Покупатель выбирает созданную обязательную добавку.
 * 27. Покупатель добавляет выбранный товар в корзину.
 * 28. Покупатель увеличивает количество товара в корзине до двух.
 * 29. Покупатель указывает номер телефона.
 * 30. Покупатель запрашивает одноразовый код.
 * 31. Покупатель указывает полученный одноразовый код.
 * 32. Покупатель подтверждает номер телефона.
 * 33. Покупатель оформляет заказ.
 *
 * Ожидаемый результат:
 * - Результат: созданный заказ имеет идентификатор и содержит выбранные наименование, вариант, обязательную добавку, количество, цену и итог.
 */
```

Действия ниже вызываются без внешнего wrapper: их внутренние action-step принадлежат
Page/Component Object. Метод чтения возвращает наблюдаемые значения без assertions.
Одна смысловая контрольная точка объединена одним `test.step`, а каждое значение
внутри неё проверяется отдельным `expect` с собственным сообщением.

```ts
const data = createProductOrderScenarioData(testInfo);

await backOffice.menu.categoryEditor.startCreation();
await backOffice.menu.categoryEditor.fillName(data.categoryName);
await backOffice.menu.categoryEditor.fillDescription(data.productDescription);
await backOffice.menu.categoryEditor.save();

await backOffice.menu.productEditor.startCreation();
await backOffice.menu.productEditor.selectCategory(data.categoryName);
await backOffice.menu.productEditor.selectType("DRINK");
await backOffice.menu.productEditor.fillName(data.productName);
await backOffice.menu.productEditor.fillDescription(data.productDescription);
await backOffice.menu.productEditor.setPrice("S", data.productPrice);
await backOffice.menu.productEditor.setPrice("M", data.productPrice);
await backOffice.menu.productEditor.setPrice("L", data.productPrice);
await backOffice.menu.productEditor.save();

await backOffice.menu.modifierGroupEditor.startCreation();
await backOffice.menu.modifierGroupEditor.fillName(data.modifierGroupName);
await backOffice.menu.modifierGroupEditor.addOption();
await backOffice.menu.modifierGroupEditor.fillOptionName(data.modifierName);
await backOffice.menu.modifierGroupEditor.setOptionPrice("0");
await backOffice.menu.modifierGroupEditor.save();

await backOffice.menu.assignments.openCategory(data.categoryName);
await backOffice.menu.assignments.selectGroup(data.modifierGroupName);
await backOffice.menu.assignments.save();

await publicMenu.product.openCategory(data.categoryName);
await publicMenu.product.openProduct(data);
await publicMenu.product.selectVariant(data.productSize);
await publicMenu.product.selectModifier(data.modifierName);
await publicMenu.product.addToCart();
await checkout.cart.setQuantity(data.productName, data.productQuantity);

await checkout.phoneVerification.fillPhone(customer.phone);
await checkout.phoneVerification.requestCode();
await checkout.phoneVerification.fillCode(customer.otp);
await checkout.phoneVerification.confirm();
await checkout.cart.placeOrder();
const expectedTotal = Number(data.productPrice) * data.productQuantity;

await test.step("Результат: созданный заказ имеет идентификатор и содержит выбранные наименование, вариант, обязательную добавку, количество, цену и итог.", async () => {
  const order = await customerOrder.details.read();

  expect(order.id, "Созданный заказ имеет идентификатор.").toMatch(
    orderIdPattern,
  );
  expect(
    order.productName,
    "Наименование товара сохранено без изменений.",
  ).toBe(data.productName);
  expect(order.variant, "Выбранный вариант товара сохранён.").toBe(
    data.productSize,
  );
  expect(order.modifierName, "Обязательная добавка сохранена.").toBe(
    data.modifierName,
  );
  expect(order.quantity, "Выбранное количество товара сохранено.").toBe(
    data.productQuantity,
  );
  expect(order.unitPrice, "Цена единицы товара сохранена без изменений.").toBe(
    Number(data.productPrice),
  );
  expect(order.total, "Итоговая цена заказа рассчитана правильно.").toBe(
    expectedTotal,
  );
});

await backOffice.menu.productEditor.archive(data.productName);
await backOffice.menu.modifierGroupEditor.archive(data.modifierGroupName);
await backOffice.menu.categoryEditor.archive(data.categoryName);

await test.step("Результат очистки: данные сценария отсутствуют в активном каталоге.", async () => {
  await backOffice.menu.catalog.assertScenarioAbsent(data);
});
```

Page собирает компоненты и знает только свой экран:

```ts
export class CheckoutPage {
  public readonly cart: CartPanelComponent;
  public readonly phoneVerification: PhoneVerificationComponent;

  constructor(page: Page) {
    this.cart = new CartPanelComponent(page);
    this.phoneVerification = new PhoneVerificationComponent(page);
  }
}
```

Публичный метод Component Object оформляет одно действие так:

```ts
async selectModifier(name: string): Promise<void> {
  await test.step(`Выбрать добавку «${name}»`, async () => {
    await this.modifier(name).click();
    await expect(this.modifier(name)).toBeChecked();
  });
}

private modifier(name: string): Locator {
  return this.options.getByRole("radio", { name, exact: true });
}
```

Не допускаются следующие формы:

- JSDoc без одного из четырёх обязательных разделов, без нумерованных шагов либо с техническими шагами: сценарий нельзя прочитать как пользовательский путь.
- Контрольная точка раздела `Ожидаемый результат` без одноимённого business-level `test.step`, шаги в другом порядке или несколько business-level шагов на одну контрольную точку: исходный код и отчёт больше не соответствуют ожидаемому результату.
- Business-level `test.step`, который вызывает объект без предметной проверки: отчёт показывает действие, но не подтверждает его результат.
- Подмена business-level шага вложенным шагом компонента: отчёт теряет цель пользовательского сценария.
- Один тест одновременно публикует товар, оформляет заказ, выдаёт его и проверяет историю под названием одной из этих возможностей: это смешивает цели. Такой путь — только отдельный `full journey` наряду с атомарными тестами.
- Нумерованные setup или cleanup: техническое обеспечение сценария выдано за пользовательский результат.
- `page.locator(...)`, `page.getByTestId(...)` или `page.waitForTimeout(...)` в spec: локаторы и ожидания принадлежат объекту.
- Проверка только toast или URL после оформления: она не доказывает, что заказ создан с нужным составом и итогом.
- Монолитный метод наподобие `submitAsGuest()`, который открывает корзину, меняет количество, подтверждает телефон, заполняет профиль и оформляет заказ: это workflow нескольких областей, а не действие компонента.
- Селектор `.order-card:last-child`, `article`, `.menu-category__toggle` или выбор «последнего» поля: DOM-структура не является тестовым контрактом.

## Fixtures, данные и окружение

- Spec импортирует расширенные Playwright fixtures из `fixtures/test.ts`; это единая публичная точка для `test` и `expect`.
- Тестовые данные имеют предметное имя, находятся в `support/data` и получают уникальность от идентификатора запуска, а не от глобального изменяемого состояния.
- `support/config` проверяет обязательные `E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL`. Учётные данные и другие секреты не размещаются в spec и документации.
