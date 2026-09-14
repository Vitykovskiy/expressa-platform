---
title: PostgreSQL и одноразовая инициализация
type: data
owner: backend
last_verified: 2026-09-14
sources:
  - ../../schema.sql
  - ../../scripts/initialize-database.ts
  - ../../scripts/reset-test-database.ts
  - ../../scripts/seed.ts
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
