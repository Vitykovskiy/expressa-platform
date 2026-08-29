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

Ответственность выбирается по вопросу, на который отвечает код:

| Вопрос                                                       | Владелец         |
| ------------------------------------------------------------ | ---------------- |
| Что пользователь делает дальше и что должно получиться?      | Spec             |
| Как открыть экран и из каких устойчивых областей он состоит? | Domain Page      |
| Как взаимодействовать с одной областью экрана?               | Component Object |
| Какие технические зависимости получает test?                 | Fixture          |
| Какие предметные значения создаёт сценарий?                  | `support/data`   |
| Как читается и проверяется окружение?                        | `support/config` |

Если метод одновременно отвечает на несколько вопросов, ответственность смешана.
Например, Component Object не создаёт товар в back-office, не переходит во
front-office и не оформляет заказ одним методом: порядок этих действий принадлежит
spec, а каждый компонент выполняет только свою часть UI.

## Структура и TypeScript

- Используется строгий TypeScript; `any` не применяется. Публичные входы, результаты чтения и предметные данные типизируются явно.
- Системное UI-значение — значение из конечного набора, заданного интерфейсом: тип, размер, роль, статус или режим. Каждое такое значение выражается TypeScript `enum` владельца Page или Component Object, а публичный метод принимает этот `enum`. Строковый литерал, общий `string`, string literal union, constants-object и отдельный метод для каждого значения не заменяют `enum` и запрещены: spec и тестовые данные передают член `enum`, поэтому IDE показывает допустимые варианты, а TypeScript отклоняет неизвестный.
- Свободные данные, создаваемые сценарием или вводимые пользователем, остаются `string`: например, имя, описание, телефон, OTP, цена и идентификатор, созданный сценарием.
- Технические ключи полей, `data-testid` и строки Playwright-локаторов остаются private-деталью реализации Page/Component Object. Они не входят в публичный API и не передаются из spec. Прямые импорты из `front-office/src` и `back-office/src` не используются: standalone E2E сохраняет собственный типизированный контракт.
- Page живёт в `pages/<office>/<area>/<page-name>/`. Local Component Object, используемый только этим Page, живёт внутри его каталога. Page не повторяет действия своих компонентов и не содержит workflow нескольких областей; local Component не управляет другим экраном и не содержит предметных правил приложения.
- `components/<office>/<area>/` содержит только Shared Component Object, который используют минимум два разных Page Objects. Пока второго Page-потребителя нет, Component остаётся local внутри Page-владельца.
- `*.constants.ts` и `*.types.ts` принадлежат одному конкретному Page либо Component Object, лежат в каталоге владельца и имеют с ним одинаковое базовое имя. Каждый именованный module-scope `const`, задающий статический UI-контракт или конфигурацию владельца, выносится в `<owner>.constants.ts`, а каждый именованный module-scope `type`, `interface` или `enum` владельца — в `<owner>.types.ts`, независимо от `export` и повторного использования. В частности, `currencyFormatter`, `orderHeadingPattern` и `orderIdPattern` — константы владельца. Локальные переменные, параметры методов, private Locator-поля и иные детали, не являющиеся module-scope UI- или config-контрактом, остаются в классе. Общие предметные контракты не копируются между владельцами.
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

### Системные и свободные значения

Тип зависит не от внешнего вида значения, а от того, кто задаёт множество
допустимых вариантов.

| Значение                         | Владелец допустимых вариантов | Тип                                  |
| -------------------------------- | ----------------------------- | ------------------------------------ |
| Размер товара `S`, `M`, `L`      | интерфейс приложения          | `enum ProductSize`                   |
| Статус заказа                    | интерфейс приложения          | `enum OrderStatus`                   |
| Созданное тестом название товара | сценарий                      | `string`                             |
| Телефон и OTP из окружения       | тестовое окружение            | `string` после проверки конфигурации |

Хорошо:

```ts
export enum ProductSize {
  S = "S",
  M = "M",
  L = "L",
}

async selectSize(size: ProductSize): Promise<void> {
  await this.size(size).click();
}

await product.selectSize(ProductSize.M);
await productEditor.fillName(data.productName);
```

Плохо:

```ts
// Общий string скрывает допустимые размеры от TypeScript и IDE.
async selectSize(size: string): Promise<void> {}

// Literal union дублирует системный контракт без владельца.
async selectSize(size: "S" | "M" | "L"): Promise<void> {}

// Отдельные методы раздувают API одним методом на каждое значение.
async selectSmallSize(): Promise<void> {}
async selectMediumSize(): Promise<void> {}
async selectLargeSize(): Promise<void> {}
```

`enum` не применяется к свободным данным. Название `Напиток E2E 42` нельзя
включить в конечный перечень: оно создаётся сценарием и передаётся как `string`.

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
- Публичный API Page/Component Object принимает системное UI-значение только через `enum` владельца и не раскрывает технические ключи полей или селекторы.
- Форму локаторов и границу публичных методов определяет раздел [Локаторы: свойства и фабрики](#локаторы-свойства-и-фабрики).
- Сначала используются роль с доступным именем, подпись или стабильный `id`. `data-testid` — минимальный контракт для структурной части интерфейса, которую нельзя выбрать семантически (например, итог строки или корень повторяемой карточки).
- Нельзя строить контракт на CSS-классах, HTML-тегах, `.first()`, `.last()`, `nth()` или порядке DOM.
- UI-действие ожидает наблюдаемый результат через web-first `expect`. Фиксированные задержки не используются.
- Объект представляет экран, устойчивую область экрана либо переиспользуемый компонент. Он не содержит бизнес-правила приложения, подготовку через API и логику другого экрана.
- Импорты разделяются пустой строкой: сначала внешние модули, затем внутренние значения, затем `type`-импорты. В классе пустыми строками разделяются публичная композиция, приватные локаторы, конструктор, публичные действия и приватные фабрики. Форматтер не заменяет эту структуру.
- Запрещены `test.only`, `test.skip`, `describe.only`, отладочные паузы и временные обходы без отдельного назначения.

### Локаторы: свойства и фабрики

Форма локатора показывает его назначение при чтении класса. Постоянный элемент
является свойством компонента, элемент с входным параметром создаётся фабрикой,
а публичный метод выполняет пользовательское действие или читает наблюдаемое
состояние. Локаторы не входят в публичный API Page/Component Object.

| Что представляет член класса                                        | Форма                                         |
| ------------------------------------------------------------------- | --------------------------------------------- |
| Один постоянный элемент интерфейса                                  | `private readonly` свойство типа `Locator`    |
| Элемент, зависящий от имени, статуса, размера или другого параметра | private factory-метод с результатом `Locator` |
| Пользовательское действие или чтение состояния                      | публичный метод                               |

`Locator` в Playwright ленивый: свойство не сохраняет найденный DOM-элемент.
Актуальный элемент ищется при `click`, `fill`, `expect` и другом обращении,
поэтому постоянный локатор не нужно повторно создавать методом или getter.

Хороший пример:

```ts
export class ProductEditorComponent {
  private readonly dialog: Locator;
  private readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole("dialog");
    this.cancelButton = this.dialog.getByRole("button", {
      name: "Отмена",
      exact: true,
    });
  }

  async cancelCreation(): Promise<void> {
    await test.step("Отменить создание товара", async () => {
      await this.cancelButton.click();
      await expect(
        this.dialog,
        "Редактор нового товара закрыт без сохранения.",
      ).toHaveCount(0);
    });
  }

  private productEditButton(name: string): Locator {
    return this.page.getByRole("button", {
      name: `Редактировать товар ${name}`,
      exact: true,
    });
  }
}
```

Здесь `dialog` и `cancelButton` обозначают конкретные элементы и читаются без
скобок. `productEditButton(name)` остаётся методом, потому что его локатор зависит
от имени товара. `cancelCreation()` является публичным действием и владеет
непосредственным видимым результатом отмены.

Антипримеры:

```ts
// Плохо: метод без параметров маскирует постоянный элемент под действие.
private cancelButton(): Locator {
  return this.dialog().getByRole("button", { name: "Отмена" });
}

// Плохо: getter повторно создаёт описание одного и того же локатора без пользы.
private get cancelButton(): Locator {
  return this.dialog.getByRole("button", { name: "Отмена" });
}

// Плохо: локатор раскрывает внутреннее устройство компонента вызывающему коду.
public readonly cancelButton: Locator;
```

В первом случае вызов `cancelButton()` выглядит как поведение, хотя только
возвращает элемент. Во втором getter не делает DOM-состояние актуальнее: эту
гарантию уже даёт Playwright. В третьем spec получает возможность самостоятельно
кликать и строить ожидания, обходя публичное действие компонента.

### Предусловия и подготовка

Предусловия — состояние, существующее до начала `test`. Для каждого предусловия
указывается источник: изолированный профиль, тестовое окружение или доступная роль.
Начальное состояние профилей и момент выполнения seed определяет
[E2E на VPS](../../../docs/70-deployment/E2E-on-VPS.md#изолированные-тесты).
Seed выполняется перед всем профилем, поэтому тесты не считают общие изменяемые
данные восстановленными между сценариями.

Fixture предоставляет технические зависимости: Page Objects, browser context,
конфигурацию и тестовые учётные данные. Fixture не авторизует пользователя, не
создаёт предметные данные и не изменяет состояние приложения.

Если авторизация не является целью сценария, она выполняется через UI в отдельном
ненумерованном шаге `Подготовка: пользователь авторизуется`. Если сценарий
проверяет авторизацию, её действия входят в нумерованный `Сценарий`.

Каждое предметное UI-действие, выполненное самим тестом, отражается в
`Сценарии` в фактическом порядке. Его нельзя скрывать в `Предусловиях` или общем
шаге подготовки. Тест использует неизменяемые данные профиля либо создаёт
уникальные данные и не зависит от состояния, оставленного другим тестом.

Хорошо — профиль предоставляет каталог, а тест через UI выполняет только
необходимую авторизацию и действия проверяемого пути:

```ts
/**
 * Назначение: customer не получает второй заказ при повторном оформлении.
 *
 * Предусловия: профиль mutating содержит опубликованный капучино размера M;
 * customer без заказов может подтвердить тестовый номер телефона.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает опубликованный капучино.
 * 4. Customer выбирает размер M.
 * 5. Customer добавляет товар в корзину.
 * 6. Customer открывает корзину.
 * 7. Customer дважды выбирает оформление заказа до показа результата.
 * 8. Customer открывает историю заказов.
 *
 * Ожидаемый результат:
 * - Customer видит один созданный заказ.
 * - В истории customer существует только один новый заказ.
 */
test("CHECKOUT-07: customer не получает второй заказ", async ({
  customerAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  orderHistory,
  publicMenu,
}) => {
  await test.step("Подготовка: customer авторизуется", async () => {
    await customerAuth.open(e2eEnvironment.frontOfficeUrl);
    await customerAuth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await customerAuth.phoneVerification.requestCode();
    await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await customerAuth.phoneVerification.confirm();
  });

  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectVariant(ProductSize.M);
  await publicMenu.product.addToCart();
  await checkout.cart.open();
  await checkout.cart.placeOrderTwice();

  await test.step("Customer видит один созданный заказ.", async () => {
    const order = await customerOrder.details.readReference();

    expect(order.id, "Созданный заказ имеет идентификатор.").not.toBe("");
  });

  await orderHistory.open();
  await test.step("В истории customer существует только один новый заказ.", async () => {
    const orderCount = await orderHistory.history.readOrderCount();

    expect(orderCount, "В истории находится один заказ.").toBe(1);
  });
});
```

Плохо — комментарий объявляет готовые данные, но сам тест скрытно создаёт их под
общим названием подготовки:

```ts
/**
 * Предусловия: в корзине есть опубликованный капучино.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer дважды оформляет заказ.
 */
test("повторное оформление", async () => {
  await test.step("Подготовка", async () => {
    await backOffice.menu.categoryEditor.startCreation();
    await backOffice.menu.productEditor.startCreation();
    await customerAuth.phoneVerification.confirm();
    await publicMenu.product.addToCart();
  });

  await checkout.cart.open();
  await checkout.cart.placeOrderTwice();
});
```

Такой JSDoc не соответствует коду: категория, товар, авторизация и корзина не
существовали до `test`. Предметные действия необходимо либо получить из контракта
профиля, либо перечислить в `Сценарии`.

### Контракт сценария

Каждый атомарный `test` проверяет одну бизнес-цель. Ненумерованная подготовка
ограничена авторизацией, если она не является целью сценария. Предметные действия
подготовки входят в нумерованный сценарий; тест не очищает созданные им предметные
данные. Сквозной путь допускается отдельным `full journey`-test, когда он
проверяет связь нескольких возможностей и не заменяет их атомарные проверки.
В таком пути все UI-действия явно нумеруются. Быстрое двойное нажатие — один
пункт, если оно проверяет защиту одного намерения customer, а не две операции.

JSDoc и business-level шаги показывают бизнес-путь в исходном коде и отчёте
Playwright. Вложенные шаги компонентов помогают найти сломанное UI-действие, но
не являются заменой шага сценария. Ниже приведён именно `full journey`: длинный
путь допустим, потому что его назначение — проверить связь нескольких возможностей.

```ts
/**
 * Назначение: проверить сквозной путь от публикации товара до созданного заказа.
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
 * - Результат: созданный заказ имеет идентификатор и содержит выбранные наименование, размер, обязательную добавку и количество.
 */
```

Действия ниже вызываются без внешнего wrapper: их внутренние action-step принадлежат
Page/Component Object. Метод чтения возвращает наблюдаемые значения без assertions.
Одна смысловая контрольная точка объединена одним `test.step`, а каждое значение
внутри неё проверяется отдельным `expect` с собственным сообщением.

```ts
import {
  ProductSize as ProductEditorSize,
  ProductType,
} from "@pages/back-office/menu/menu-management/product-editor/product-editor.types";
import { ProductSize as ProductConfiguratorSize } from "@pages/front-office/menu/public-menu/product-configurator/product-configurator.types";

const data = createProductOrderScenarioData(testInfo.testId);

await backOffice.menu.categoryEditor.startCreation();
await backOffice.menu.categoryEditor.fillName(data.categoryName);
await backOffice.menu.categoryEditor.fillDescription(data.productDescription);
await backOffice.menu.categoryEditor.save();

await backOffice.menu.productEditor.startCreation();
await backOffice.menu.productEditor.selectCategory(data.categoryName);
await backOffice.menu.productEditor.selectType(ProductType.DRINK);
await backOffice.menu.productEditor.fillName(data.productName);
await backOffice.menu.productEditor.fillDescription(data.productDescription);
await backOffice.menu.productEditor.setPrice(
  ProductEditorSize.S,
  data.productPrice,
);
await backOffice.menu.productEditor.setPrice(
  ProductEditorSize.M,
  data.productPrice,
);
await backOffice.menu.productEditor.setPrice(
  ProductEditorSize.L,
  data.productPrice,
);
await backOffice.menu.productEditor.save(data.productName);

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
await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
await publicMenu.product.selectModifier(data.modifierName);
await publicMenu.product.addToCart();
await checkout.cart.setQuantity(data.productName, data.productQuantity);

await checkout.phoneVerification.fillPhone(customer.phone);
await checkout.phoneVerification.requestCode();
await checkout.phoneVerification.fillCode(customer.otp);
await checkout.phoneVerification.confirm();
await checkout.cart.placeOrder();
await test.step("Результат: созданный заказ имеет идентификатор и содержит выбранные наименование, размер, обязательную добавку и количество.", async () => {
  const order = await customerOrder.details.readSnapshot();

  expect(order.id, "Созданный заказ имеет идентификатор.").not.toBe("");
  expect(
    order.productName,
    "Наименование товара сохранено без изменений.",
  ).toBe(data.productName);
  expect(order.size, "Выбранный размер товара сохранён.").toBe(
    data.productSize,
  );
  expect(order.modifierName, "Обязательная добавка сохранена.").toBe(
    data.modifierName,
  );
  expect(order.quantity, "Выбранное количество товара сохранено.").toBe(
    String(data.productQuantity),
  );
});
```

### Практика: Page и Component Object

Создайте Page как корень одного экрана: он собирает его устойчивые области и
проверяет готовность. Для каждой области создайте local Component Object с
private-локаторами и публичными атомарными действиями; системный выбор выразите
`enum` этого владельца. Spec вызывает только публичное действие, а оно ожидает
свой непосредственный видимый результат через web-first `expect`.

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

Типовой контракт компонента живёт в соседнем `product-configurator.types.ts`:

```ts
export enum ProductSize {
  S = "S",
  M = "M",
  L = "L",
}
```

Компонент импортирует контракт, скрывает локаторы и оформляет выбор одного
системного значения:

```ts
import { ProductSize } from "./product-configurator.types";

async selectSize(size: ProductSize): Promise<void> {
  await test.step(`Выбрать размер ${size}`, async () => {
    await this.size(size).click();
    await expect(this.size(size)).toBeChecked();
  });
}

private size(size: ProductSize): Locator {
  return this.options.getByRole("radio", { name: size, exact: true });
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

Fixture только собирает технические зависимости. Хорошо:

```ts
type E2eFixtures = {
  readonly checkout: CheckoutPage;
  readonly customerAuth: CustomerAuthPage;
  readonly e2eCredentials: E2eCredentials;
};

export const test = base.extend<E2eFixtures>({
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  customerAuth: async ({ page }, use) => {
    await use(new CustomerAuthPage(page));
  },
  e2eCredentials: async ({}, use) => {
    await use(getE2eCredentials());
  },
});
```

Плохо — fixture выполняет предметный workflow и скрывает его от scenario/report:

```ts
export const test = base.extend({
  preparedCheckout: async ({ e2eCredentials, e2eEnvironment, page }, use) => {
    const auth = new CustomerAuthPage(page);
    const menu = new PublicMenuPage(page);

    await auth.open(e2eEnvironment.frontOfficeUrl);
    await auth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
    await auth.phoneVerification.requestCode();
    await auth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await auth.phoneVerification.confirm();
    await menu.open(e2eEnvironment.frontOfficeUrl);
    await menu.product.openCategory("Кофе");
    await menu.product.openProduct("Капучино");
    await menu.product.selectVariant(ProductSize.M);
    await menu.product.addToCart();
    await use(new CheckoutPage(page));
  },
});
```

Fixture из антипримера одновременно авторизует пользователя, создаёт предметное
состояние и меняет корзину. Spec получает готовый результат без видимого
пользовательского пути и не доказывает заявленные возможности по отдельности.

Данные сценария также не хранятся в глобальном счётчике:

```ts
// Хорошо: каждый вызов создаёт независимый набор.
const data = createProductOrderScenarioData(testInfo.testId);

// Плохо: результат зависит от порядка запуска и общей памяти worker.
let sequence = 0;
const productName = `Товар ${sequence++}`;
```
