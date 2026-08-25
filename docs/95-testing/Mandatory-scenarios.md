---
type: testing
owner: root
last_verified: 2026-08-16
sources:
  - ../_sources/Expressa_MVP_Техническое_задание.md
---

# Обязательные E2E-сценарии

Это единый каталог главных пользовательских путей. Он описывает, что должен
подтвердить браузерный E2E; подробные API, DTO, CRUD-перестановки и выпускные
проверки остаются в профильных источниках.

`runtime-confirmed` входит в текущий green gate.
`runtime-confirmed-doc-conflict` также входит: runtime имеет приоритет над
устаревшей нотой, но конфликт надо устранить. `requirement-not-implemented` и
`unable-to-confirm` не являются текущими обязательными E2E.

## Общие предусловия

- Чистая БД после migrations и seed; administrator, barista и два customer с
  уникальными телефонами. Development OTP применяется только local/development.
- Опубликованный каталог: `DRINK` S/M/L, drink только S, `OTHER`, обязательная
  группа с бесплатным default и платной option; доступная и недоступная позиции,
  intake true/false, заказы в нужных стадиях.
- Ошибки воспроизводятся управляемыми ответами API. Для mutation проверяются
  отсутствие частичной записи и дубля.

Полная матрица viewport, accessibility и уровни проверок — в
[стратегии тестирования](Test-strategy.md); пороги — в
[покрытии и quality gates](Coverage-and-quality-gates.md).

## Текущий runtime

В строках: «Ветви» включают валидацию, loading/disabled и ошибку, когда они
применимы. Все источники содержат бизнес-норму из frontmatter и runtime-ссылку.

| ID, актор / контуры | Предусловия и действия | Ожидаемый результат и существенные ветви | Статус | Источники |
|---|---|---|---|---|
| AUTH-01<br>гость, customer / FO+BE | Новый или существующий номер; ввести телефон, запросить и подтвердить OTP. | Первый вход создаёт customer, повторный находит того же; открывается безопасный внутренний `returnTo`. Loading блокирует повтор; внешний URL, `//` и auth-route заменяются `/`. | `runtime-confirmed` | [FO router](../../front-office/src/app/router.ts), [auth API](../../front-office/src/shared/api/auth.api.ts) |
| AUTH-02<br>гость, customer / FO+BE | Открыт challenge; отправить неверный, истёкший и пятый неверный OTP; неполный телефон/код; повтор в cooldown и параллельно. | Сессия не создаётся; неполные значения не вызывают API; один открытый challenge. Cooldown 60 секунд; OTP не раскрывается в `requestId`, Origin и ответах. | `runtime-confirmed` | [FO auth E2E](../../front-office/tests/e2e/auth.e2e.spec.ts), [OpenAPI](../../backend/openapi/openapi.json) |
| AUTH-03<br>customer / FO+BE | Активная сессия и корзина; reload, logout, защищённый URL анонимно, старый refresh. | Refresh и `/me` восстанавливают сессию; refresh ротируется; logout отзывает сессию, очищает cookie и корзину. Старый refresh отклонён; аноним получает внутренний `returnTo`. | `runtime-confirmed` | [session store](../../front-office/src/app/session.store.ts), [auth API](../../front-office/src/shared/api/auth.api.ts) |
| AUTH-04<br>аноним, staff, customer / BO+BE | Подготовлены телефоны barista, administrator, customer; пройти phone+OTP, reload и logout. | Staff попадает в `/queue`; customer получает отказ и очищенную сессию. Невалидные телефон/OTP отклоняются локально; 401 очищает сессию. | `runtime-confirmed` | [BO login](../../back-office/src/pages/LoginPage.vue), [BO auth E2E](../../back-office/tests/e2e/auth.e2e.ts) |
| ROLE-01<br>barista, administrator, customer / BO+FO+BE | Сессии всех ролей; открыть staff routes прямым URL, проверить navigation и customer-order. | Barista видит queue/availability, administrator также menu; customer не получает staff routes; staff не создаёт customer-order. Guard и скрытая навигация согласованы; 401/403 безопасны. | `runtime-confirmed` | [BO router](../../back-office/src/app/router.ts), [FO router](../../front-office/src/app/router.ts) |
| MENU-01<br>гость, customer / FO+BE | Опубликованный каталог; отдельно empty, API error, intake closed; открыть `/` и retry. | Loading сменяется опубликованными доступными категориями и товарами; empty/error/retry наблюдаемы; закрытый intake не скрывает меню. | `runtime-confirmed` | [public menu API](../../front-office/src/shared/api/public-menu.api.ts), [menu E2E](../../front-office/tests/e2e/menu.e2e.spec.ts) |
| MENU-02<br>гость, customer / FO | Категория и товар; пройти root → category → product → browser back. | History и выбранный контекст возвращаются корректно; в деталях floating-cart скрыта. | `runtime-confirmed` | [FO router](../../front-office/src/app/router.ts), [menu E2E](../../front-office/tests/e2e/menu.e2e.spec.ts) |
| MENU-03<br>гость, customer / FO+BE | `DRINK` S/M/L, drink только S, `OTHER`, default и платные options; выбрать размер, options, quantity. | Total отражает конфигурацию; по умолчанию выбран M, иначе первый/единственный доступный размер; обязательные free defaults выбраны. Товар без размера работает; недопустимая конфигурация не отправляется; quantity доступен с клавиатуры. | `runtime-confirmed` | [menu store](../../front-office/src/entities/customer/model/menu.store.ts), [menu E2E](../../front-office/tests/e2e/menu.e2e.spec.ts) |
| CART-01<br>гость, customer / FO | Добавить одинаковую и отличающуюся конфигурации; reload и OTP. | Одинаковые конфигурации объединены, разные остаются строками; корзина переживает reload и вход. Восстановленные данные сверяются с актуальной формой меню. | `runtime-confirmed` | [cart store](../../front-office/src/entities/customer/model/cart.store.ts), [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts) |
| CART-02<br>гость, customer / FO | Непустая корзина, в том числе недоступная/устаревшая позиция; изменить quantity, удалить и очистить. | Total и localStorage синхронны; empty ведёт в меню; недоступность и старая цена видимы. Изменение сбрасывает checkout error; mobile fixed submit и desktop summary доступны. | `runtime-confirmed` | [cart store](../../front-office/src/entities/customer/model/cart.store.ts), [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts) |
| CHECKOUT-01<br>customer / FO+BE | Customer-сессия, валидная корзина, intake true; подтвердить checkout. | Создаётся `CREATED` с актуальными config и total; корзина очищается, открывается `/orders/:id` со snapshot. Submit disabled; snapshot неизменяем. | `runtime-confirmed` | [orders API](../../front-office/src/shared/api/orders.api.ts), [revalidation](../../backend/src/orders/domain/order-revalidation.ts) |
| CHECKOUT-02<br>customer / FO+BE | Цена корзины устарела; получить `ORDER_TOTAL_CHANGED`, подтвердить новую сумму. | Новый total виден; до подтверждения заказа нет; после него создаётся заказ по актуальной цене. Отмена не создаёт заказ. | `runtime-confirmed` | [checkout store](../../front-office/src/features/checkout/checkout.store.ts), [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts) |
| CHECKOUT-03<br>customer / FO+BE | Отдельно unavailable item и intake false; отправить checkout. | `MENU_ITEM_UNAVAILABLE` или `ORDER_INTAKE_CLOSED` не создаёт заказ; проблемная позиция выделена, меню доступно; retry не блокируется навсегда. | `runtime-confirmed` | [revalidation](../../backend/src/orders/domain/order-revalidation.ts), [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts) |
| CHECKOUT-04<br>customer / FO+BE | Валидная корзина и UUID key; ответ первого submit потерян; повторить с тем же key, эквивалентным и иным body, конкурентно и другим customer. | Retry возвращает тот же заказ без дубля; иное body даёт `IDEMPOTENCY_KEY_REUSED`; другой customer может использовать key. UI блокирует повторный submit до ответа. | `runtime-confirmed` | [orders API](../../front-office/src/shared/api/orders.api.ts), [OpenAPI](../../backend/openapi/openapi.json) |
| ORDER-01<br>customer / FO | Только что создан order; отдельно иной ID и reload без store; открыть `/orders/:id`. | Совпадающий ID показывает checkout snapshot; иной ID/reload показывает unavailable без read API. Длинные имена и modifiers не ломают layout. | `runtime-confirmed` | [FO router](../../front-office/src/app/router.ts), [checkout store](../../front-office/src/features/checkout/checkout.store.ts) |
| ORDER-02<br>customer, аноним / FO | Customer-сессия и аноним; открыть `/orders`. | Customer видит статическую защищённую оболочку, аноним идёт на вход. Список, polling, repeat и push здесь не ожидаются. | `runtime-confirmed` | [FO router](../../front-office/src/app/router.ts), [FO scope](../../front-office/docs/00-meta/Scope.md) |
| QUEUE-01<br>barista, administrator / BO+BE | Заказы; отдельно empty и error; открыть queue, фильтр stage, поиск number, refresh, polling. | Loading сменяется списком либо «Заказов нет»; filter/search/refresh/polling получают актуальную очередь. Error даёт `alert` и retry. | `runtime-confirmed-doc-conflict` | [QueuePage](../../back-office/src/pages/QueuePage.vue), [orders API](../../back-office/src/shared/api/orders.api.ts), [устаревшая нота](../../back-office/docs/30-domains/Inactive-screens.md) |
| QUEUE-02<br>barista, administrator / BO+BE | Заказ с items/modifiers; открыть, закрыть, быстро сменить заказ, дать detail error. | Видны snapshot, items, modifiers; повторное открытие закрывает details; устаревший ответ не заменяет новый выбор. Ошибка безопасна. | `runtime-confirmed-doc-conflict` | [OrdersScreen](../../back-office/src/pages/admin/orders/OrdersScreen.vue), [orders API](../../back-office/src/shared/api/orders.api.ts), [устаревшая нота](../../back-office/docs/30-domains/Inactive-screens.md) |
| QUEUE-03<br>barista, administrator / BO+BE | Заказ `CREATED`; fixture каждой допустимой стадии; последовательно выполнить transition. | Строгий путь `CREATED` → `ACCEPTED` → `PREPARING` → `READY` → `ISSUED`. Недоступное действие hidden/disabled; повтор disabled; неверная стадия/customer не меняют order; transition error видима. | `runtime-confirmed-doc-conflict` | [OpenAPI](../../backend/openapi/openapi.json), [orders API](../../back-office/src/shared/api/orders.api.ts), [устаревшая нота](../../back-office/docs/30-domains/Inactive-screens.md) |
| AVAIL-01<br>barista, administrator / BO+BE | Intake и groups; отдельно empty и GET error; открыть availability, искать, менять category filter. | Loading сменяется intake/groups либо empty; поиск и фильтры локальны; GET error даёт alert/retry. | `runtime-confirmed-doc-conflict` | [AvailabilityPage](../../back-office/src/pages/AvailabilityPage.vue), [availability API](../../back-office/src/shared/api/availability.api.ts), [устаревшая нота](../40-features/Manage-availability.md) |
| AVAIL-02<br>barista, administrator / BO+BE | Доступная позиция; переключить с success и error save. | Optimistic UI подтверждается сервером; во время save toggle disabled. Ошибка откатывает UI и показывает request ID. | `runtime-confirmed-doc-conflict` | [AvailabilityScreen](../../back-office/src/pages/admin/availability/AvailabilityScreen.vue), [availability API](../../back-office/src/shared/api/availability.api.ts), [устаревшая нота](../40-features/Manage-availability.md) |
| AVAIL-03<br>barista, administrator / BO+BE | Intake с metadata; выключить/включить, дать error update. | Server response обновляет state и metadata изменившего/даты; error откатывает optimistic state. | `runtime-confirmed-doc-conflict` | [AvailabilityScreen](../../back-office/src/pages/admin/availability/AvailabilityScreen.vue), [availability API](../../back-office/src/shared/api/availability.api.ts), [устаревшая нота](../40-features/Manage-availability.md) |
| CATALOG-01<br>administrator / BO+BE | Непустой/пустой catalog и API error; открыть `/menu`, management mode, раскрыть/свернуть группы. | Loading сменяется данными/empty; нет horizontal overflow. Error — safe alert/retry; loading блокирует content через `aria-busy`/`inert`. | `runtime-confirmed` | [MenuPage](../../back-office/src/pages/MenuPage.vue), [catalog API](../../back-office/src/shared/api/catalog.api.ts), [catalog E2E](../../back-office/tests/e2e/catalog.e2e.ts) |
| CATALOG-02<br>administrator / BO+BE | Несколько категорий; создать, изменить, reorder, archive, отменить confirm. | Сохранены только подтверждённые изменения; reorder меняет порядок; archived category не активна. Cancel ничего не меняет; draft/focus восстановлены. | `runtime-confirmed` | [catalog API](../../back-office/src/shared/api/catalog.api.ts), [catalog E2E](../../back-office/tests/e2e/catalog.e2e.ts) |
| CATALOG-03<br>administrator / BO+BE | Категории `DRINK`/`OTHER`; создать, изменить, reorder, archive товары, category/sizes/activity. | Корректные товары сохраняются; порядок/archive применяются. Пустые поля, отрицательная цена, активный drink без доступного размера дают field error и не сохраняются. | `runtime-confirmed` | [catalog API](../../back-office/src/shared/api/catalog.api.ts), [catalog E2E](../../back-office/tests/e2e/catalog.e2e.ts), [OpenAPI](../../backend/openapi/openapi.json) |
| CATALOG-04<br>administrator / BO+BE | Category и modifier group; CRUD/reorder group/options, assignment группе категории. | Сохранены валидные group, options, порядок и assignment. Server field errors привязаны к полю и снимаются после изменения. | `runtime-confirmed` | [catalog API](../../back-office/src/shared/api/catalog.api.ts), [catalog E2E](../../back-office/tests/e2e/catalog.e2e.ts), [OpenAPI](../../backend/openapi/openapi.json) |
| CROSS-01<br>administrator → гость, customer / BO+BE+FO | Administrator создаёт/публикует catalog; есть старый order snapshot; открыть FO menu, затем archive/unpublish. | Published catalog доступен для config; archived/unpublished — нет. Изменение catalog не меняет старый snapshot. | `runtime-confirmed` | [catalog API](../../back-office/src/shared/api/catalog.api.ts), [public menu API](../../front-office/src/shared/api/public-menu.api.ts) |
| CROSS-02<br>staff → customer / BO+BE+FO | Available item, intake true, cart и созданный order; staff выключает item/intake, затем возвращает. | Недоступная позиция не проходит checkout; closed intake блокирует новый order, но не menu/существующую queue; возврат разрешает checkout. Отказ не создаёт order. | `runtime-confirmed-doc-conflict` | [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts), [availability API](../../back-office/src/shared/api/availability.api.ts), [устаревшая нота](../40-features/Manage-availability.md) |
| CROSS-03<br>customer → barista / FO+BE+BO | Customer создаёт order, barista авторизован; открыть queue и провести order до issue. | Order появляется в queue и выдаётся без дубля; customer не делает staff transition; staff не меняет customer snapshot. | `runtime-confirmed-doc-conflict` | [checkout E2E](../../front-office/tests/e2e/checkout.e2e.spec.ts), [orders API](../../back-office/src/shared/api/orders.api.ts), [OpenAPI](../../backend/openapi/openapi.json) |
| UI-01<br>все UI-акторы / FO+BO | Menu/auth/cart/order/queue/availability/catalog с длинным content на 320, 390, 479/480, 767/768, 1023/1024, 1280, 1440 px. | Нет horizontal overflow и перекрытия controls; mobile fixed action/desktop summary доступны; длинный content не ломает layout. | `runtime-confirmed` | [стратегия](Test-strategy.md), [FO smoke](../../front-office/tests/e2e/foundation-smoke.spec.ts), [BO screenshots](storybook-screenshots/back-office/manifest.json) |
| UI-02<br>все UI-акторы / FO+BO | Управляемые ready/loading/empty/error/mutation responses; пройти главные пути клавиатурой. | Наблюдаемы loading/ready/empty/error/disabled; корректны focus, labels, regions, live/status/alert, `aria-pressed`. Ошибки формы блокируют недопустимое действие; reduced motion соблюдён. | `runtime-confirmed` | [стратегия](Test-strategy.md), [menu E2E](../../front-office/tests/e2e/menu.e2e.spec.ts), [catalog E2E](../../back-office/tests/e2e/catalog.e2e.ts) |
| ERROR-01<br>все роли / FO+BO+BE | API отдаёт OTP, validation, load и mutation errors. | UI показывает safe `code`, `message`, `requestId`; validation использует field details. OTP, cookie, stack/internal details не раскрыты; failed command не оставляет partial data. | `runtime-confirmed` | [BO API errors](../../back-office/docs/30-domains/api-integration-and-errors.md), [OpenAPI](../../backend/openapi/openapi.json), [FO auth E2E](../../front-office/tests/e2e/auth.e2e.spec.ts) |

## Целевые требования вне текущего runtime green gate

| ID | Требование | Почему не текущий runtime | Условие включения | Источник |
|---|---|---|---|---|
| TARGET-01 | Customer видит current/history snapshots, polling останавливается после `ISSUED`. | `/orders` — статическая оболочка, активный GET consumer не найден. | Active route consumer, опубликованный контракт и runtime E2E. | [ТЗ](../_sources/Expressa_MVP_Техническое_задание.md), [FO scope](../../front-office/docs/00-meta/Scope.md) |
| TARGET-02 | Customer повторяет order по текущим цене и availability. | Repeat consumer/runtime не найден. | Active action/API и определённые revalidation errors. | [ТЗ](../_sources/Expressa_MVP_Техническое_задание.md), [FO scope](../../front-office/docs/00-meta/Scope.md) |
| TARGET-03 | Customer получает push на `ACCEPTED`, `READY`, `ISSUED`; barista — о новом order. | Subscription endpoint не доказывает delivery и активный UI consumer. | Подтверждены producer, delivery, permission flow и consumer. | [ТЗ](../_sources/Expressa_MVP_Техническое_задание.md), [FO push E2E](../../front-office/tests/e2e/push.e2e.spec.ts) |
| TARGET-04 | Customer выбирает slot/время. | Active runtime не подтверждён. | Бизнес-правило slots, API и UI consumer. | [ТЗ](../_sources/Expressa_MVP_Техническое_задание.md) |

Статус всех этих строк: `requirement-not-implemented`.

## Пробелы и вопросы

### GAP-01 — fixture для UI-доступности выдачи

- Статус: `unable-to-confirm`.
- Вопрос: backend подтверждает `READY` → `ISSUED`, но точные UI-предусловия,
  при которых `issue` доступен в BO, надо зафиксировать воспроизводимой fixture.
- Пересмотр: добавить fixture в runtime E2E либо component test `OrdersScreen`,
  затем уточнить только предусловие `QUEUE-03`.
- Источники: [OrdersScreen](../../back-office/src/pages/admin/orders/OrdersScreen.vue), [OpenAPI](../../backend/openapi/openapi.json).

## За пределами пользовательского E2E

Покрытие, accessibility/performance evidence, безопасность, приватность,
индексы/N+1, миграции, backup/restore, staging и production SMS относятся к
модульным, интеграционным, контрактным или release-проверкам. Они ведутся в
[стратегии](Test-strategy.md), [quality gates](Coverage-and-quality-gates.md) и
[проверке выпуска](Release-verification.md), без дублирования в этом каталоге.

## Условия пересмотра

Пересматривать каталог при изменении router/API consumer/OpenAPI, ролей, стадий
заказа, idempotency/revalidation, publication catalog, availability/intake,
viewport-матрицы либо при появлении history/repeat/push/slot runtime. После
актуализации placeholder-нот queue/availability их статус меняется на
`runtime-confirmed` без изменения ID и смысла кейса.
