---
title: "Размещение кода back-office"
type: convention
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-25
sources:
  - ../../src/main.ts
  - ../../src/app/App.vue
  - ../../src/app/AppContent.vue
  - ../../src/app/useApplicationDomains.ts
  - ../../src/layouts/AppLayout.vue
  - ../../src/layouts/AppNavigation.vue
  - ../../../docs/20-architecture/ADR/ADR-015-back-office-domain-structure.md
  - ../../../docs/80-conventions/Code-Definition-of-Done-back-office.md
  - ../10-architecture/ui-ownership.md
---

# Размещение кода back-office

Исходники перенесены в предметную структуру по
[ADR-015](../../../docs/20-architecture/ADR/ADR-015-back-office-domain-structure.md).
Нормативный владелец — [технический DoD](../../../docs/80-conventions/Code-Definition-of-Done-back-office.md).
Это карта исходников; перенос и сборка не подтверждают runtime или пользовательскую приёмку.

## Корни и зависимости

- `app` собирает запуск, вход/рабочее содержимое, URL/history, общий сброс
  идентичности и native intent. Импортирует layouts, modules и shared.
- `layouts` содержит AppLayout, AppNavigation, соседние контракты и assets.
  Импортирует собственные файлы и shared; не импортирует app, modules,
  store, HTTP или native controllers.
- `modules/<область>` содержит реальные Page/Route, API, DTO, mapper, store
  и helpers этой области. Дочернее представление, его контракты и assets
  находятся в `components`, где они существуют. Module импортирует свои
  файлы и shared. Существующие исключения session: auth использует session
  store, UsersRoute — StaffSession, notifications — LogoutProofSupplier.
  Session не импортирует потребителей. Новых межпредметных связей нет.
- `shared` содержит локальный технический HTTP и переиспользуемые UI-примитивы
  без предметного состояния; не импортирует app/layouts/modules.

Глобальных pages/widgets/features/entities, staff-каталога композиции,
совместимых файлов-прокси и пустых каталогов нет. Прямые импорты сохраняются;
barrels и aliases ради переноса не добавлены. Именованные типы лежат в соседних
`*.types.ts`, константы уровня модуля — в `*.constants.ts`. Исходники других
приложений не импортируются.

## Маршрутизация

[ADR-016](../../../docs/20-architecture/ADR/ADR-016-back-office-vue-router.md)
задаёт Vue Router5.4.0: bootstrap монтирует persistent App после isReady;
router.ts сопоставляет пять named paths с конкретными компонентами, metadata
задаёт title/access. AppContent выводит matched RouterView Component и кеширует
только CatalogPage, max1. Ключ AppContent — ID/role/token, не fullPath.
Layout получает готовые navigation props, RouterLink сохраняет native anchors.
App владеет afterEach/onError и native/background-переходами; OrdersRoute —
своими named pushes. Orders-navigation валидирует normalized business query,
без URL origin и выбора страниц. Неизвестный application path redirect orders
с пустыми query/hash; обычный `/` сохраняет query/hash без section.

## Ресурсы

Импортируемые изображения лежат рядом с самым узким владельцем исходников:
иконки навигации — в `layouts/assets`, изображения формы входа и доступности —
в `components/assets` своей области. Сборщик управляет их итоговыми ссылками;
импортированный ресурс может быть встроен, отдельный файл не гарантируется.

`public` содержит ресурсы с намеренно прямыми URL и сохранёнными именами:
текущие UI-иконки, шрифты, manifest, PWA-иконки и service worker. Путь
публичного ресурса соответствует его потребителю: например, иконка товара
доступна как `/catalog/product-chevron.svg`. Пустые каталоги и placeholders
для будущих ресурсов не создаются.

## Предметные области

| Каталог                 | Что читать внутри                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `modules/auth`          | AuthPage, useAuthEntry, auth API, phone helpers; формы в components.                                                                 |
| `modules/session`       | Store/API и контракты сеанса.                                                                                                        |
| `modules/orders`        | OrdersRoute, OrdersPage, store/API/DTO/mapper и orders-navigation; карточки и диалог в components.                                   |
| `modules/availability`  | AvailabilityPage, store/API/DTO/mapper; фильтры, группы и строки в components.                                                       |
| `modules/catalog`       | CatalogPage, store/API/DTO/mapper, catalog-editor и catalog-pricing; меню, диалоги и CatalogOptionGroupSelect в components.          |
| `modules/users`         | UsersRoute, UsersPage, store/API/DTO; users.mapper преобразует DTO, users.presenter готовит UI/query; строки и диалоги в components. |
| `modules/settings`      | SettingsRoute, SettingsPage, store/API/DTO/validation; форма, поля и recovery в components.                                          |
| `modules/notifications` | Store/API, native-push и native-intent; NotificationsDialog в components.                                                            |

Users domain-контракты сохраняют `users.types.ts` и `users.constants.ts`.
Store-контракты различимы как `users.store.types.ts` и `users.store.constants.ts`;
`components/Users.types.ts` и `Users.constants.ts` сохраняют свой регистр и UI-владельца.
CatalogOptionGroupSelect находится рядом со своим единственным компонентом-потребителем
CatalogCategoryDialog; его тип опции также использует CatalogEditor.types.

## Композиция и layout

`app/App.vue` выбирает кешированный вход или рабочее содержимое с ключом
`ID:role:token`, сохраняет restore/expiry/logout, native intent/proof
и фоновые сообщения. Адрес и history принадлежат injected Vue Router. `app/AppContent.vue` компонует пять рабочих страниц,
роль и отказ, NotificationsDialog, активацию владельцев, Catalog KeepAlive
`max=1`, title и content focus. `app/router.ts` выбирает пять компонентов и задаёт metadata, root/catch-all redirect;
`app/useApplicationDomains.ts` синхронно очищает защищённых владельцев и
связывает catalog revision с invalidation доступности.

`layouts/AppLayout.vue` — общий авторизованный каркас с действиями учётной
записи и выбором уведомления. Он принимает readonly props, сообщает действия
событиями и выводит default slot. AppContent помещает в slot сначала
NotificationsDialog, затем `.staff-content`; ref, стили и фокус остаются у
AppContent. AppNavigation содержит пять разделов Administrator и два Barista.
Вход сохраняет самостоятельное представление без защищённой навигации.
Бизнес-команды остаются у stores; API и DTO не смешаны с компонентами.

## Четыре пути первого чтения

- Каркас и навигация: [AppLayout](../../src/layouts/AppLayout.vue),
  [AppNavigation](../../src/layouts/AppNavigation.vue), затем
  [AppContent](../../src/app/AppContent.vue) с содержимым и lifecycle.
- Заказы: [OrdersRoute](../../src/modules/orders/OrdersRoute.vue),
  [OrdersPage](../../src/modules/orders/OrdersPage.vue),
  [store](../../src/modules/orders/orders.store.ts), [API](../../src/modules/orders/orders.api.ts).
- Меню: [CatalogPage](../../src/modules/catalog/CatalogPage.vue),
  [CatalogCategoryDialog](../../src/modules/catalog/components/CatalogCategoryDialog.vue)
  и [CatalogOptionGroupSelect](../../src/modules/catalog/components/CatalogOptionGroupSelect.vue).
- Смена сеанса: ключ в [App](../../src/app/App.vue),
  [useApplicationDomains](../../src/app/useApplicationDomains.ts) и
  [session store](../../src/modules/session/session.store.ts).

Публичные URL текущего worker `/service-worker.js`, manifest и assets,
DOM и порядок CSS сохранены переносом. Снятые `/queue`, `/availability`,
`/menu`, `/sw.js` не возвращены; [границы входа](../10-architecture/pwa-installation.md#текущий-вход-и-снятые-переходы)
не менялись. Подробные обязанности состояния и команд принадлежат
[UI ownership](../10-architecture/ui-ownership.md), HTTP/native —
[интеграционной ноте](../10-architecture/staff-read-slice.md).
