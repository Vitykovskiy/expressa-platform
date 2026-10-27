---
title: "ADR-015: предметная структура back-office"
type: adr
area: architecture
status: accepted
owner: root
date: 2026-10-25
last_verified: 2026-10-25
sources:
  - ../../../AGENTS.md
  - ../../80-conventions/Code-Definition-of-Done-back-office.md
  - ../../../back-office/docs/80-conventions/code-layout.md
  - ../../../back-office/docs/10-architecture/ui-ownership.md
  - ADR-011-back-office-clean-slate.md
  - ADR-013-back-office-feature-organization.md
  - ADR-014-back-office-composition-and-current-entry.md
knowledge_role: decision
scope: back-office
---

# ADR-015: предметная структура back-office

Навигация и bootstrap уточняются [ADR-016](ADR-016-back-office-vue-router.md):
Vue Router выбирает страницы и владеет адресом/историей по ADR-016; orders-navigation валидирует бизнес-query.
Остальные правила размещения и владельцев сохраняются.

## Уточнение маршрутизации

[ADR-016](ADR-016-back-office-vue-router.md) заменяет положения о root/query,
section selection и server404 для application paths: пять named routes,
RouterView и home redirect неизвестного пути. Остальные границы сохраняются;
ниже описаны исходное решение и его исторические наблюдения.

## Контекст

Пользователь отклонил текущую структуру back-office и прямо поручил её
рефакторинг: новичку трудно выбрать между `pages`, `widgets`, `features`
и `entities`, найти общий layout и понять назначение `app/staff/StaffScreen`.
Сохранение FSD не является целью. Например, чтение каталога сейчас требует
переходов между четырьмя одноимёнными предметными каталогами; stores users
и notifications находятся в features, остальные предметные stores — в entities.

Это разрешение на замену организации исходников. Оно не означает приёмку
пользователем результата или разрешение менять продукт, API, UI и срок жизни
состояния. Настоящая запись задаёт целевой контракт для независимого review
до переноса кода. Статус `accepted` фиксирует выбранную архитектуру;
независимая проверка этой записи ещё требуется перед зависимым кодом. Фактические
пути до переноса описывает [локальная карта](../../../back-office/docs/80-conventions/code-layout.md).

## Решение

### Каталоги и владельцы

Используем `app`, `layouts`, `modules`, `shared`. Каждая бизнес-область имеет
одно место в `modules`; глобальные `pages`, `widgets`, `features`, `entities`
после переноса отсутствуют. Внутри области сохраняются отдельные обязанности
API, DTO, маппера, store и представления. Обязательные вложенные `api/model/ui`
не создаются. Это локальная предметная структура без требования соответствия FSD.

Пути ниже относительно `back-office/src` являются **целевыми**, а не выполненным переносом:

```text
src/
  main.ts
  app/
    App.vue
    AppContent.vue
    navigation.ts
    useApplicationDomains.ts
    bootstrap.ts, styles.css, theme.constants.ts
    соседние контракты
  layouts/
    AppLayout.vue
    AppNavigation.vue
    соседние контракты и assets/
  modules/
    auth/
    session/
    orders/
    availability/
    catalog/
    users/
    settings/
    notifications/
    <область>/components/  # только существующее дочернее представление
  shared/
```

`App.vue` сохраняет запуск ветви сеанса, выбор входа или рабочего содержимого,
ключ `ID:role:token`, restore/expiry/logout, URL/history и native intent/proof.
`AppContent.vue` сохраняет границу прежнего StaffScreen: выбор пяти рабочих
страниц, отказ в доступе, активацию, NotificationsDialog, Catalog KeepAlive
`max=1`, title и content focus. Это композиция приложения; отдельной предметной
области staff и дополнительной визуальной обёртки нет.

`layouts/AppLayout.vue` — общий каркас всех авторизованных разделов:
навигация, действия учётной записи и выбор уведомления. `AppNavigation.vue`
владеет представлением разделов, их порядком и иконками. Props/events/default
slot из [ADR-014](ADR-014-back-office-composition-and-current-entry.md#экран-и-layout)
сохраняются с согласованным переименованием StaffSection в AppSection.
Фокус, history, stores, HTTP и native controllers остаются вне layout.
Вход остаётся другой ветвью App с прежними представлением, кешем и фокусом;
защищённая навигация до авторизации не появляется.

Корни orders/users/settings содержат существующие `OrdersRoute`/`UsersRoute`/
`SettingsRoute` и соответствующие Page: Route сохраняет URL/session/activation,
Page — композицию представления. Availability и Catalog сохраняют свои Page;
пустые Route-обёртки для симметрии не добавляются. Auth содержит AuthPage,
API входа, useAuthEntry и phone helpers; session — store/API/контракты сеанса.
Notifications содержит store/API и native push/intent. Дочернее представление,
его стили, assets и соседние контракты находятся в `components` своей области.

### Зависимости

- `app` импортирует layouts, modules и shared и собирает межпредметные связи.
- `layouts` импортирует только собственные контракты/assets и shared;
  импорты app, modules, stores, HTTP и native controllers запрещены.
- Module импортирует собственные файлы и shared. Сохраняются только существующие
  межпредметные исключения: auth использует session store; UsersRoute —
  StaffSession; notifications — тип захваченного logout proof из session.
  Session не импортирует этих потребителей. Новая связь соседних областей
  требует отдельного основания; перенос её не вводит.
- `shared` содержит локальный технический HTTP и переиспользуемые UI-примитивы,
  не импортирует app/layouts/modules, предметные DTO и состояние.
- Catalog revision и invalidation availability связывает
  `app/useApplicationDomains.ts`. App напрямую использует notification native
  intent, как и прежде. Состояние и команды имеют прежних единственных владельцев.
- Внутри module дочернее представление сохраняет props/events и чистые helpers;
  API/store-доступ в него не переносится. API и парсеры не зависят от компонентов
  Vue и Pinia. Сохраняются логические и type-only связи; новые runtime-циклы запрещены.

Сохраняются прямые именованные импорты, соседние `*.types.ts` и `*.constants.ts`.
Barrels, aliases, proxy re-exports, копии состояния и совместимые старые пути
ради переноса не вводятся. Импорты исходников других приложений запрещены.

### Правила переноса

1. `pages/<область>/*` и плоские `entities/<область>/*` переходят в
   `modules/<область>/*`; соседние типы и константы следуют владельцу.
2. `features/<область>/ui/*` и `widgets/<область>/*`, кроме staff, переходят
   в `modules/<область>/components/` с дочерними assets и порядком стилей.
   Nonvisual `features/<область>/model/*` и `features/auth/api/*` переходят
   в корень соответствующей области. Компоненты и их шаблоны не сливаются.
3. `entities/catalog/ui/CatalogOptionGroupSelect*` переходят в
   `modules/catalog/components/` рядом с CatalogCategoryDialog.
   Catalog editor и pricing остаются в корне catalog.
4. При коллизиях users entity-файлы `users.mapper.ts`, `users.types.ts`,
   `users.constants.ts` сохраняют имена. Одноимённые feature model-файлы
   получают имена `users.presenter.ts`, `users.store.types.ts`,
   `users.store.constants.ts` соответственно; exports сохраняются.
   `features/users/ui/Users.types.ts` и `Users.constants.ts` переходят в
   components без изменения регистра. Перезапись коллизий запрещена.
5. `widgets/staff/StaffWorkspaceLayout*` переходят в `layouts/AppLayout*`,
   `StaffNavigation*` — в `layouts/AppNavigation*`, assets — в `layouts/assets/`.
   Соседние контракты и component-facing identifiers переименовываются согласованно:
   `StaffSection` в `AppSection`, `STAFF_NAVIGATION` в `APP_NAVIGATION`.
   Значения, порядок разделов и условия ролей сохраняются.
6. `app/staff/StaffScreen*` переходят в `app/AppContent*`; navigation и его типы —
   в `app/`; useStaffDomains и его export/потребители — в useApplicationDomains.
   Бизнес-термины StaffSession и другие действующие employee-контракты сохраняются.
7. Все потребители импортов, assets и активные ссылки обновляются согласованно.
   Main/bootstrap/shared, публичные URL, package/configuration semantics сохраняются.
   Каждый исходный source unit учитывается в карте старого/нового размещения,
   включая неизменённые файлы; достижимый код не удаляется из-за пустого соседа.
8. Удаляются только фактически пустые каталоги операцией удаления пустого каталога,
   включая опустевших родителей. Неожиданные файлы сохраняются; каталогов на будущее нет.
   Комментарии кратко объясняют только неочевидные решения и инварианты.

## Переход

В части размещения и направления зависимостей этот контракт заменяет
FSD-правила [ADR-013](ADR-013-back-office-feature-organization.md), пути и
запрет отдельного layout из раздела «Экран и layout»
[ADR-014](ADR-014-back-office-composition-and-current-entry.md#экран-и-layout),
а также прежнюю цепочку слоёв, сохранённую
[ADR-011](ADR-011-back-office-clean-slate.md#сохраняемые-границы).
Другие нормы этих решений и технического DoD сохраняются. Старые решения
хранят историю; их пути не описывают новый целевой каталог.

Нормативная запись и её независимое review предшествуют переносу композиции.
После review реализация одновременно обновляет фактические README, code-layout,
UI ownership, COVERAGE и затронутые architecture/integration/PWA-ноты.
До реального переноса их текущие пути сохраняются с явным указанием целевого
контракта. Датированные свидетельства и неизвестный runtime не переписываются.

Сохраняются все требования перехода ADR-014: роли и пять/два раздела;
отказ при неизвестном, пустом, дублированном или запрещённом section;
явный `section=orders`, query/hash/history и модифицированные клики;
API paths/payloads/parsers/errors, store IDs; keyed remount и синхронный
сброс защищённых владельцев; подавление поздних ответов; прекращение обычных
неактивных чтений и продолжение отправленных команд у прежних владельцев;
Catalog KeepAlive/revision, settings draft, кеш входа и фокус, barista-only
уведомления, lifetime native intent и захват logout proof. Не возвращаются
снятые legacy URL/worker-переходы; текущий вход, HTTP и native-контракты
ADR-014 остаются действующими.

Перенос сохраняет DOM, slots, attributes, CSS/selectors, порядок вычисления
импортов, bytes assets и семантику событий. Если требуется видимое изменение
или иной lifetime, зависимая правка останавливается для уточнения контракта;
для видимого UI применяется [визуальный процесс](../../40-quality/Validation-strategy.md#процесс-визуальной-работы)
с финальным осмотром и независимой визуальной проверкой.

Применяются существующие нетестовые проверки и независимое source review.
Новые проверочные scripts/validators не создаются. Автоматизированные тесты
до явной приёмки пользователем запрещены, после неё требуют прямого запроса.
Исходники и сборка не подтверждают runtime, визуальную сохранность или
пользовательскую приёмку. Version/changelog/tag и поставка не требуются:
это внутренняя организация без изменения публичного поведения и без запроса выпуска.

## Последствия

Новичок выбирает бизнес-область до технической обязанности файла. Layout виден
в корне исходников; композиция и срок жизни страниц остаются в app.
Проверяемые пути чтения после переноса: layouts/AppLayout и AppNavigation;
modules/orders/OrdersRoute, OrdersPage, store/API; modules/catalog/CatalogPage,
components/CatalogCategoryDialog и CatalogOptionGroupSelect; app/App,
useApplicationDomains и modules/session/session.store.

Цена решения — согласованный перенос прямых импортов и документации.
Сохранение глобальных FSD-слоёв оставило бы четыре места поиска каталога;
группировка по техническим типам снова разнесла бы одну область по корням.
Ни один вариант не даёт выбранного единого предметного входа. Пересмотр нужен
при неразрешённой коллизии, новой ownership-зависимости, требуемом изменении
поведения или сохранении прежнего выбора между глобальными слоями.
