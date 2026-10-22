---
title: "PostgreSQL и одноразовая инициализация"
type: data
owner: backend
last_verified: 2026-10-21
sources:
  - ../../schema.sql
  - ../../scripts/initialize-database.ts
  - ../../scripts/reset-test-database.ts
  - ../../scripts/seed.ts
knowledge_role: implementation
scope: backend
---

# PostgreSQL и одноразовая инициализация

`schema.sql` — единственный декларативный источник актуальной PostgreSQL-схемы.
Поддерживаются только пустые одноразовые базы local, test и development:
сначала к ним применяется `npm run db:init`, затем `npm run seed`.
[Схема](../../schema.sql), [инициализатор](../../scripts/initialize-database.ts),
[seed](../../scripts/seed.ts).

Инициализатор отказывается работать, если в целевой базе уже есть прикладные
таблицы. Он не удаляет, не обновляет и не сохраняет строки. Сброс базы —
отдельная операция в явно настроенном disposable-контексте; для integration
проверок это [reset-test-database](../../scripts/reset-test-database.ts).

Истории миграций, таблицы `schema_migrations`, backfill, rollback и поддержка
поставки поверх заполненной базы отсутствуют намеренно. Если данным потребуется
переживать поставку, это требует нового архитектурного решения до включения
такой среды.

Схема хранит users, OTP/sessions, каталог, audit и заказы. Каталог и заказ
фиксируются в собственных транзакционных границах. [Catalog runner](../../src/catalog/adapters/postgres-catalog-command.runner.ts),
[Order unit of work](../../src/orders/adapters/postgres-order-unit-of-work.ts).

Seed детерминированно создаёт каноничное меню и bootstrap administrator при
`BOOTSTRAP_ADMIN_PHONE`. Повторный seed после инициализации сохраняет этот
каноничный набор. Staging и production не входят в поддерживаемую поставку.

## Данные полного back-office

По [ADR-012](../../../docs/20-architecture/ADR/ADR-012-back-office-source-contract.md)
`users` хранит nullable `name` и согласованную пару `blocked_at`/`blocked_by`.
Имя отсутствует у созданного через OTP клиента, пока оно не задано настоящей
командой; seed не выдумывает имена и не создаёт проверочные аккаунты.

`orders` сохраняет прежние пять `order_stage`. Отказ — отдельные согласованные
`rejected_at`, `rejected_by`, `rejection_reason`, допустимые только при CREATED;
причина непустая. `pickup_slot_start` и `pickup_slot_end` либо оба отсутствуют,
либо образуют десятиминутное окно. Снимки позиций, суммы и история сохраняются.

`service_operating_settings` — отдельная singleton-строка с `id=1`, временем
открытия раньше закрытия, положительной целой вместимостью, парой nullable
`updated_at`/`updated_by`. Прежняя `service_settings.accepts_new_orders` не
заменяется. Seed вставляет 09:00–20:00, вместимость 5, без автора изменения;
повторный seed сохраняет уже существующие настройки. UTC — политика ADR-012,
а не часовой пояс браузера или дополнительный столбец таблицы.

Схема и seed создают хранение; серверные команды, аудит, распределение,
проверка блокировок и новые HTTP-проекции реализуются отдельными владельцами.
