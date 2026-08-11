---
title: Доменная модель
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/migrations/0002_e01_core_schema.sql
  - ../../backend/migrations/0003_e04_auth.sql
  - ../../backend/migrations/0004_e05_catalog.sql
  - ../../backend/migrations/0005_e06_catalog_admin.sql
  - ../../backend/migrations/0006_e07_orders.sql
---

# Доменная модель

Пользователь хранит E.164-телефон и роль; роли ограничены `customer`,
`barista`, `administrator`. [backend/migrations/0002_e01_core_schema.sql:users](../../backend/migrations/0002_e01_core_schema.sql).

OTP challenge хранит хеш кода, срок, попытки и потребление.
[backend/migrations/0003_e04_auth.sql:otp_challenges](../../backend/migrations/0003_e04_auth.sql).

Session хранит пользователя, хеш refresh token, срок, отзыв и ротацию.
[backend/migrations/0003_e04_auth.sql:sessions](../../backend/migrations/0003_e04_auth.sql).

Каталог хранит категории.
[backend/migrations/0004_e05_catalog.sql:categories](../../backend/migrations/0004_e05_catalog.sql).

Каталог хранит товары.
[backend/migrations/0004_e05_catalog.sql:products](../../backend/migrations/0004_e05_catalog.sql).

Каталог хранит варианты товаров.
[backend/migrations/0004_e05_catalog.sql:product_variants](../../backend/migrations/0004_e05_catalog.sql).

Группы модификаторов хранят варианты модификаторов.
[backend/migrations/0004_e05_catalog.sql:modifier_options](../../backend/migrations/0004_e05_catalog.sql).

`category_modifier_groups` назначает группы категориям.
[backend/migrations/0004_e05_catalog.sql:category_modifier_groups](../../backend/migrations/0004_e05_catalog.sql).

`audit_events` хранит автора, действие, состояния до/после и request id для
изменений. [backend/migrations/0005_e06_catalog_admin.sql:audit_events](../../backend/migrations/0005_e06_catalog_admin.sql).

Заказ хранит customer, idempotency key, итог и номер UTC-дня.
[backend/migrations/0006_e07_orders.sql:orders](../../backend/migrations/0006_e07_orders.sql).

Позиции заказа сохраняют снимки имён и цен.
[backend/migrations/0006_e07_orders.sql:order_items](../../backend/migrations/0006_e07_orders.sql).

Модификаторы заказа сохраняют снимки имени и изменения цены.
[backend/migrations/0006_e07_orders.sql:order_item_modifiers](../../backend/migrations/0006_e07_orders.sql).

`service_settings` содержит `accepts_new_orders`.
[backend/migrations/0006_e07_orders.sql:service_settings](../../backend/migrations/0006_e07_orders.sql).
