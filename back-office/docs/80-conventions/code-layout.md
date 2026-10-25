---
title: "Размещение кода back-office"
type: convention
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-25
sources:
  - ../../src/main.ts
  - ../../../docs/80-conventions/Code-Definition-of-Done-back-office.md
  - ../10-architecture/ui-ownership.md
---

# Размещение кода back-office

Нормативный владелец структуры — [технический DoD](../../../docs/80-conventions/Code-Definition-of-Done-back-office.md).
Направление зависимостей: `app -> pages -> widgets -> features -> entities -> shared`.
Пустые слои ради схемы не создаются. `widgets/staff` содержит адаптивный
`StaffWorkspaceLayout` и source-навигацию пяти разделов Administrator и двух
разделов Barista. Layout принимает readonly props, сообщает действия событиями
и выводит один default slot; страницы, store, HTTP и app он не импортирует.
`app/App.vue` соединяет вход и staff-сеанс, URL/history, native intent/proof
и фоновые сообщения. `app/staff/StaffScreen.vue` компонует пять рабочих страниц,
проверку роли и отказ, `NotificationsDialog`, активацию владельцев, KeepAlive,
title и content focus. `app/staff/navigation.ts` разбирает URL intent,
`app/staff/useStaffDomains.ts` владеет общим сбросом идентичности и связью
catalog revision с доступностью. Бизнес-команды остаются у доменных владельцев.
Это фактическое разделение следует
[ADR-014](../../../docs/20-architecture/ADR/ADR-014-back-office-composition-and-current-entry.md#экран-и-layout).

`pages` собирают auth, orders, availability, catalog, users и settings.
`features` владеют вводом, редактированием и действиями; `entities` — DTO,
HTTP, подтверждёнными данными и командами. Notifications feature использует
нативную browser-границу в entities; worker расположен в public и не импортирует
app. `shared` содержит транспорт и source UI-примитивы без предметного состояния.
Подробные границы — в [описании владельцев](../10-architecture/ui-ownership.md)
и [HTTP-ноте](../10-architecture/staff-read-slice.md).

Именованные типы размещаются в соседних `*.types.ts`, константы уровня модуля —
в `*.constants.ts` по DoD. Импорты исходников, конфигурации и типов других
приложений запрещены. Текущая реализация не добавляет общий межконтурный пакет.

## Текущее размещение features

[ADR-013](../../../docs/20-architecture/ADR/ADR-013-back-office-feature-organization.md)
задаёт адаптацию FSD с явными импортами модулей. Предметные переносы выполнены:
`auth` содержит `api`, `model` и `ui`; `catalog`, `users` и `notifications` —
`model` и `ui`; `availability`, `orders` и `settings` — `ui`.
Прежних feature-каталогов `presentation` и совместимых файлов-прокси нет.
Навигация заказов находится рядом со своим маршрутом в `pages/orders`.

- `api` содержит HTTP-модули feature, `model` — состояние и логику сценария,
  `ui` — компоненты, стили и presentation-модули. Сегменты появляются по
  существующим обязанностям; небольшие связные entity-модули остаются плоскими.
  `entities/catalog/ui/CatalogOptionGroupSelect.vue` изолирует конкретный
  Vuetify multiselect категорий; редактор и ценовая политика остаются в
  `features/catalog/model`.
- Типы и константы перемещаются с модулем-владельцем. Общий контракт
  импортируется от своего владельца, а не дублируется между сегментами.
- Композиция разных областей остаётся в `app` и страницах; маршрутная
  навигация — у своей страницы. Нижние слои не импортируют верхние.
- Внешние потребители сохраняют явные именованные импорты модулей,
  внутри области используются относительные пути. Обязательные barrels,
  глобальные aliases и proxy re-export файлы для перехода не добавляются.

Переносы включают замены путей импортов, ссылок на assets и документации.
Публичные URL текущего worker `/service-worker.js`, manifest и assets,
а также порядок CSS сохранены. Прежние `/queue`, `/availability`, `/menu`
и `/sw.js` сняты по [ADR-014](../../../docs/20-architecture/ADR/ADR-014-back-office-composition-and-current-entry.md#текущий-вход-и-снятые-переходы);
границы текущего входа описаны в [ноте установки](../10-architecture/pwa-installation.md#текущий-вход-и-снятые-переходы).
Неиспользуемая дублирующая
навигация `EmployeeNavigation` удалена; действующая навигация и её SVG
принадлежат `widgets/staff`. Это описание размещения не подтверждает
runtime или пользовательскую приёмку. Подробные обязанности состояния и команд
по-прежнему принадлежат [UI ownership](../10-architecture/ui-ownership.md).
