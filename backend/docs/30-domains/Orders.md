---
title: "Заказы"
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../openapi/openapi.json
  - ../../src/orders/transport/orders-v3.controller.ts
  - ../../src/orders/transport/backoffice-orders-v3.controller.ts
  - ../../src/orders/transport/backoffice-orders.controller.ts
knowledge_role: implementation
scope: backend
---

# Заказы

Создание, чтение и повтор customer-заказа, а также чтение очереди / деталей staff-заказа работают в v3. Четыре перехода сотрудника `accept`, `start-preparing`, `mark-ready`, `issue` остаются текущими v2 API. Методы и схемы принадлежат [OpenAPI](../../openapi/openapi.json), граница версий — [ADR-008](../../../docs/20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md).

Владельцы HTTP-границы: [customer orders](../../src/orders/transport/orders-v3.controller.ts), [staff reads](../../src/orders/transport/backoffice-orders-v3.controller.ts), [staff transitions](../../src/orders/transport/backoffice-orders.controller.ts). Общие инварианты: [жизненный цикл](../../../docs/30-domain/Order-lifecycle.md), [снимки](../../../docs/30-domain/Order-snapshots.md), [идемпотентность](../../../docs/50-interfaces/Error-model-and-idempotency.md).

## Полный source-контракт

[ADR-012](../../../docs/20-architecture/ADR/ADR-012-back-office-source-contract.md)
задаёт добавочные v3 `ready` / `reject`, фильтр `view` и настоящие поля
`customer.name`, `pickupSlot`, `rejection`. Старые v2 переходы сохранены;
отклонённый заказ отклоняет любую дальнейшую смену стадии. `stage` вместе с
`view` недопустим; `new`, `confirmed`, `ready` исключают отклонённые,
`all` включает все терминальные записи.

Administrator получает и сохраняет часы и вместимость через
`/api/v3/backoffice/settings`. Сохраняются `HH:mm`, положительная целая
вместимость, фиксированные десять минут и явный `UTC`; `opensAt < closesAt`.
Сохранение и аудит атомарны, с автором и requestId. Audit UUID singleton
настроек имеет постоянное значение `00000000-0000-4000-8000-000000000001`
в отдельном entity_type `service_operating_settings`; это идентичность аудита,
не новый ключ таблицы.

Creation и repeat распределяют ближайшее свободное окно в текущем UTC-дне,
используя блокировку строки настроек и отдельное чтение занятых окон после
получения блокировки. Вне часов или при заполнении дня —
`409 ORDER_CAPACITY_UNAVAILABLE`; исходный идемпотентный replay доступен
без нового выделения места. Денежная ревалидация и снимки сохранены.

Новые API публикуются интеграционным владельцем в OpenAPI после сборки модулей.
Эта нота не подтверждает завершение интеграции, runtime или независимую приёмку.
