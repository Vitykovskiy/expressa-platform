---
title: "Размещение кода back-office 2.0"
type: architecture
owner: back-office
knowledge_role: requirements
scope: back-office
last_verified: 2026-10-10
sources:
  - ../../../docs/80-conventions/Code-Definition-of-Done-back-office.md
  - ../../../docs/20-architecture/Client-architecture.md
  - ../../../docs/20-architecture/Repository-boundaries.md
  - ../10-architecture/ui-ownership.md
---

# Размещение кода back-office 2.0

Это размещение основания и staff-сценариев. Заняты `app`, `pages`, `widgets`, `features`, `entities`, `shared`; пустые будущие слои не создаются.

## Слои

Направление импортов: `app -> pages -> widgets -> features -> entities -> shared`.
Обязанности и условия выделения общих абстракций задаёт
[технический DoD](../../../docs/80-conventions/Code-Definition-of-Done-back-office.md#слои-и-зависимости).
Создаются только занятые слои; библиотека маршрутизации не добавляется ради одной очереди. URL-навигация принадлежит app, бизнес-состояние — Pinia владельцам.

| Текущий путь         | Ответственность                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/app/`           | Инициализация приложения и единственный владелец предпочтения темы                                      |
| `src/shared/styles/` | Primitive, semantic и необходимые component tokens, глобальный reset и правила темы                     |
| `src/shared/config/` | Чистые определения тем Vuetify и узкая фабрика инициализации                                            |
| `src/shared/ui/`     | Технические UI-примитивы без API, бизнес-моделей и состояния сценариев                                  |
| `.storybook/`        | Регистрация renderer, управление каталогом и композиция workbench; потребитель тех же тем и компонентов |

Истории размещаются рядом с компонентом и используют его публичный контракт.
Композиция workbench демонстрирует основание; она не задаёт production-layout
сотрудника и не размещается в бизнес-слое ради демонстрации.

## Файлы владельца

Именованные `type`, `interface`, `enum` и контракты находятся в соседнем
`*.types.ts`; константы уровня модуля, предметной области и конфигурации —
в соседнем `*.constants.ts`. Исполняемый файл не смешивает эти ответственности.
Условия локального вывода и исключения принадлежат
[каноничному DoD](../../../docs/80-conventions/Code-Definition-of-Done-back-office.md#типы-и-внешние-данные).

Компонент использует template-first SFC и scoped CSS по
[стилю Vue](../../../docs/40-quality/Vue-code-style.md). Технические детали
библиотеки остаются за узким публичным контрактом, не распространяются
по feature-коду.

## Автономность

Manifest, lock-файл, конфигурация и команды принадлежат back-office.
Нет импортов исходников, типов, компонентов, конфигурации или тестовых
артефактов из других приложений. Системные документы и OpenAPI — источники
контракта, а не пакеты runtime-зависимостей. Стек остаётся Vue 3, Vuetify,
TypeScript, Vite и Pinia; конкретные совместимые версии фиксируются при
создании manifest и lock-файла, без обновления соседних приложений.

## Storybook и конфигурация

Истории находятся рядом с компонентами в `*.stories.constants.ts`: определения
Meta, StoryObj и сценариев являются конфигурацией. Стандартный CSF-indexer
Storybook расширен только распознаванием этого суффикса через
`experimental_indexers` в `.storybook/main.constants.ts`; собственный parser
или генератор не создаётся. Версия Storybook зафиксирована, поэтому при её
изменении этот публичный экспериментальный API требует отдельной проверки.

Исполняемые Vite/ESLint/Storybook entry-файлы импортируют соседние владельцы
конфигурации. Workbench находится в `src/app/workbench/`: состояние демонстрации
не попадает в shared UI и не имитирует API.

## Session и order-read

`entities/catalog/`, четыре занятых `features/category-*/`, `widgets/catalog/`
и `pages/CatalogPage.vue` реализуют administrator-категории. `features/product-edit/`, `product-search/`,
`product-reorder/`, `product-archive/` и ProductList занимают товарный сценарий
по [product slice](../10-architecture/catalog-products-slice.md). Один catalog store владеет
draft/command/recovery; компоненты получают readonly props и события.
`features/modifier-group-edit/`, `modifier-group-search/`, `modifier-group-archive/`,
`modifier-option-reorder/` и ModifierWorkspace занимают aggregate и отдельный
option reorder по [modifier slice](../10-architecture/catalog-modifiers-slice.md).
CatalogOperation направляет новые статусы своему feature, прежние — прежнему
владельцу; второй store или общий command engine не создаётся.
`features/category-group-assignment/`, отдельное действие CategoryList и
AssociationCurrent занимают [полную замену связей категории](../10-architecture/catalog-associations-slice.md).
Entity mapper/API и associationTask selector используют тот же catalog owner;
shared transport method добавляет только PUT, без runtime-изменения.
[Category slice](../10-architecture/catalog-categories-slice.md) описывает полный
GET, DELETE-границу и узкую invalidation доступности через App.

`entities/availability/`, `features/availability-search/`,
`features/availability-change/`, `widgets/availability/` и
`pages/AvailabilityPage.vue` заняты новым связным сценарием.
Текущие владельцы и открытая PATCH-граница описаны в
[availability slice](../10-architecture/availability-slice.md).
App соединяет разделы без новой библиотеки маршрутизации; сохранённые страницы
не создают второго бизнес-store.

[Staff slice](../10-architecture/staff-read-slice.md) связывает живые владельцы с API и восстановлением. `pages/` соединяют store и представление; `widgets/orders/` показывают readonly модели; `features/` показывают lifecycle-action через readonly props/events и владеют OTP и намерением поиска; `entities/` — валидаторами DTO, чистыми mapper и состоянием; `shared/api/` — узким transport без доменных моделей.

## Notification lifecycle

`entities/notification/` — единственный приватный владелец proof/version,
association, original operation и epoch. `features/notifications/` получает
presentation props и сообщает read/enable/disable/finish; владеет только
dialog и initiator focus. `shared/browser/web-push.ts` выполняет generic native
операции и byte/key validation без business API или session. App задаёт
ожидаемые script/scope и соединяет logout supplier с session без upward import.
`session.types.ts` содержит только narrow supplier контракт shared proof.

Root `staff-push-worker.ts` содержит import app worker. Native ambient host,
payload/click contracts и discriminator находятся в соседних types/constants;
нет нового tsconfig, plugin, серверного middleware или WebWorker/DOM collision.
`app/notification-click.ts` владеет bounded current-source confirmation и
cleanup. App владеет одним latest deferred navigation target, не бизнес-командой.
OrderSearch сообщает только dirty boolean через OrdersPage; draft не переносится
в App. Детальные lifetimes и непроверенные native границы — в
[staff slice](../10-architecture/staff-read-slice.md#worker-и-клик).
