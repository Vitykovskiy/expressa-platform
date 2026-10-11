---
title: "Документация back-office 2.0"
type: index
owner: back-office
knowledge_role: navigation
scope: back-office
---

# Документация back-office 2.0

Вернуться к [README](../README.md) или [системной карте](../../docs/INDEX.md).
Здесь описаны основание, staff-сценарии и требования. Продолжение разрешено; независимая приёмка и полная staff-интеграция остаются открытыми.

| Задача                  | Источник                                                                                                         | Назначение                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| До изменения кода       | [Code-style DoD](80-conventions/code-style-dod.md)                                                               | Локальный маршрут обязательных критериев    |
| Размещение файлов       | [Code layout](80-conventions/code-layout.md)                                                                     | Требуемые границы ответственности           |
| Состояние, UI и темы    | [UI ownership](10-architecture/ui-ownership.md)                                                                  | Требуемый локальный контракт                |
| Продуктовый сценарий    | [Staff UI](../../docs/50-interfaces/Back-office-UI.md)                                                           | Бизнес-результаты и роли                    |
| HTTP-интеграция         | [API](../../docs/50-interfaces/Back-office-API.md), [OpenAPI](../../backend/openapi/openapi.json)                | Обзор и точные схемы                        |
| Новый визуальный облик  | [ADR-011](../../docs/20-architecture/ADR/ADR-011-back-office-clean-slate.md)                                     | Граница чистого проектирования              |
| Проверка видимого UI    | [UI DoD](../../docs/40-quality/Definition-of-done.md), [стратегия](../../docs/40-quality/Validation-strategy.md) | Свежий живой результат и независимый review |
| Обновление документации | [Протокол](../../docs/00-meta/Update-protocol.md)                                                                | Синхронизация контрактов с изменением       |

- [Дизайн-система](10-architecture/design-system.md): источники tokens, компоненты и состояния.
- [Индекс архитектуры](10-architecture/INDEX.md): карта владельцев основания.
- [Индекс соглашений](80-conventions/INDEX.md): маршрут требований перед изменением.
- [Покрытие документацией](COVERAGE.md): текущие runtime-объекты и ограничения этапа.

- [Staff read slice](10-architecture/staff-read-slice.md): session, очередь, URL, API и восстановление.
- [Локальный HTTP-снимок](../contracts/openapi.json): точные опубликованные backend-байты; [владелец](10-architecture/staff-read-slice.md#http-снимок) и незавершённая push-интеграция.
- [Availability slice](10-architecture/availability-slice.md): новые исходники, PATCH-граница, владельцы и непроверенные lifetimes.
- [Каталог и категории](10-architecture/catalog-categories-slice.md): administrator-доступ, полный GET, category-команды, draft и сверка.

- [Товары и атомарные цены](10-architecture/catalog-products-slice.md): полный product draft, identities, branch/omission/recovery и прежние category lifetimes.
- [Группы добавок и атомарный состав](10-architecture/catalog-modifiers-slice.md): полный aggregate draft, отдельный порядок, response identity и recovery.
- [Связи категории с группами](10-architecture/catalog-associations-slice.md): полный desired состав/порядок, targeted confirmation, strict PUT и current visible recovery.
- [Установка рабочего приложения](10-architecture/pwa-installation.md): manifest/иконки, push-only worker publication и ненаблюдённые native границы.
- [Notification lifecycle](10-architecture/staff-read-slice.md#уведомления-и-logout): private association/unknown recovery, narrow logout capability и latest corresponding-order click; native/API/UI приёмка открыта.
