---
title: "Каталог"
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../openapi/openapi.json
  - ../../src/catalog/transport/public-menu-v3.controller.ts
  - ../../src/catalog/transport/catalog-products-v3.controller.ts
knowledge_role: implementation
scope: backend
---

# Каталог

Публичное меню, чтение административного каталога и команды товаров работают в v3. Управление категориями и модификаторами сохраняется в v2. Точная граница версий — [ADR-008](../../../docs/20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md), методы и схемы — [OpenAPI](../../openapi/openapi.json).

Товар имеет одну цену с nullable `portionLabel` или упорядоченные `priceChoices`; модель вариантов S/M/L удалена. Владельцы HTTP-границы: [публичное меню](../../src/catalog/transport/public-menu-v3.controller.ts) и [команды товаров](../../src/catalog/transport/catalog-products-v3.controller.ts). Общая семантика — [каталог и меню](../../../docs/30-domain/Catalog-and-menu.md).
