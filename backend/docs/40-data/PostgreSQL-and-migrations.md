---
title: PostgreSQL, ограничения и миграции
type: data
owner: backend
last_verified: 2026-08-11
sources:
  - ../../migrations/0001_foundation.sql
  - ../../migrations/0006_e07_orders.sql
  - ../../src/platform/database/migrations.ts
---

# PostgreSQL, ограничения и миграции

PostgreSQL хранит users, OTP/sessions, каталог, audit и заказы. Миграции идут
последовательно; таблица `schema_migrations` хранит имя и checksum, поэтому
применённый SQL не переписывают. [Runner](../../src/platform/database/migrations.ts),
[foundation](../../migrations/0001_foundation.sql).

`0014_customer_menu_display_and_product_modifiers.sql` добавляет nullable
подписи физических порций и `product_modifier_groups` с restrictive FK.

Схема auth ограничивает российский E.164, роль, одну открытую OTP на телефон,
попытки и срок сессии. Каталог задаёт ссылки, активные уникальные позиции,
цены и варианты. Заказы закрепляют ключ идемпотентности, дневной номер, суммы,
снимки позиций и модификаторов. [auth](../../migrations/0003_e04_auth.sql),
[catalog](../../migrations/0004_e05_catalog.sql), [orders](../../migrations/0006_e07_orders.sql).

Транзакция каталога включает advisory lock и audit; транзакция заказа включает
проверку идемпотентности и все строки снимка. Это границы атомарных операций,
не правила контроллера. [Catalog runner](../../src/catalog/adapters/postgres-catalog-command.runner.ts),
[Order unit of work](../../src/orders/adapters/postgres-order-unit-of-work.ts).

`npm run seed` заполняет тестовый каталог и upsert-ит администратора при
`BOOTSTRAP_ADMIN_PHONE`; интеграционные тесты проверяют чистую схему и adapters.
[Seed](../../scripts/seed.ts), [schema tests](../../test/integration/orders-schema.integration.spec.ts).

## Notification association migration

Additive migration `0012` adds
an association version to existing push-subscription rows. It must work on clean
and populated databases without changing `0009`, preserving current owners,
endpoints and keys. Conditional insert/update/delete will use that version so a
stale stop or invalid-provider cleanup cannot remove a recreated or transferred
association. No retention job or destructive down migration is introduced.
The exact required protocol and rollout boundary are in
[ADR-005](../../../docs/20-architecture/ADR/ADR-005-customer-notification-association.md);
this is current schema behavior.
