---
title: API меню
type: interface
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/catalog/transport/public-menu-v3.controller.ts
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
---

# API меню

Публичное меню существует только как `GET /api/v3/public/menu`; Bearer token не нужен. Ответ и schemas задаёт [OpenAPI](../../backend/openapi/openapi.json). У товара либо одна цена с nullable `portionLabel`, либо упорядоченные `priceChoices` с id, price, portionLabel и availability. `portionLabel` — непрозрачный текст; variant, `S/M/L`, `variantId`, `size` и `pricingMode` отсутствуют.

Категории, modifier groups и options входят в текущую публичную проекцию. Удалённые v2 menu/product route не имеют alias. Полная граница cutover — [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md).
