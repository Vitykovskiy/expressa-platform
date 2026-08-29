---
title: API меню
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/catalog/transport/public-menu.controller.ts
---

# API меню

`GET /api/v2/public/menu` доступен без Bearer token и возвращает публичную
проекцию категорий, товаров, вариантов, модификаторов и `acceptsNewOrders`.
Схемы, поля и ответы принадлежат [OpenAPI](../../backend/openapi/openapi.json);
HTTP-вход — [PublicMenuController](../../backend/src/catalog/transport/public-menu.controller.ts).

Административное чтение и команды каталога находятся под
`/api/v2/backoffice/catalog/*`, требуют administrator и не заменяют публичную
проекцию. [API map](../../backend/docs/50-api/_MOC-api.md),
[admin controller](../../backend/src/catalog/transport/admin-catalog.controller.ts).

Клиенты используют свои OpenAPI snapshots и проверяют их синхронизацию;
детали экранов и состояния принадлежат локальным нотам. [Контракт](../20-architecture/Cross-repository-contracts.md),
[front](../../front-office/docs/30-features/Menu-and-configuration.md), [back](../../back-office/docs/30-domains/Catalog-management.md).
