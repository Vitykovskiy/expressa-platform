---
title: "Состояние приложения и API"
type: architecture
owner: front-office
last_verified: 2026-10-08
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/public-menu.api.ts
  - ../../src/shared/api/orders.api.ts
knowledge_role: implementation
scope: front-office
---

# Состояние приложения и API

Клиент использует v3 публичное меню и customer-заказы. Auth и push остаются в v2 для путей, присутствующих в [OpenAPI-снимке](../../contracts/openapi.json). Граница реализации: [public-menu API](../../src/shared/api/public-menu.api.ts), [orders API](../../src/shared/api/orders.api.ts), [session store](../../src/app/session.store.ts).

Корзина хранится под ключом `expressa.customer.cart.v3`; прежний `expressa.customer.cart` удаляется без чтения или преобразования. В конфигурации используются `priceChoices`, а не варианты S/M/L. Источники: [cart store](../../src/entities/customer/model/cart.store.ts), [ADR-008](../../../docs/20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md).

Различайте наличие endpoint в снимке и вызов из клиента: фактические операции и локальный повтор заказа описаны в [контуре](../00-meta/Scope.md) и [заказах](../30-features/Orders.md).
