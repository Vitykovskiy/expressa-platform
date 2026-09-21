---
title: Catalog
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../openapi/openapi.json
  - ../../src/catalog/transport/public-menu-v3.controller.ts
  - ../../src/catalog/transport/catalog-products-v3.controller.ts
---

# Catalog

Публичное меню, admin catalog read и product commands существуют только в v3. Категории и modifier management сохраняются в v2. Товар использует одну цену с nullable `portionLabel` либо `priceChoices`; variants/S-M-L model удалена. [ADR-008](../../../docs/20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md) задаёт exact cutover inventory.
