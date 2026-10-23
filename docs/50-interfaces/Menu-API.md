---
title: "API меню"
type: interface
owner: root
last_verified: 2026-10-23
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/catalog/transport/public-menu-v3.controller.ts
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
knowledge_role: implementation
scope: system
---

# API меню

Публичное меню доступно только как `GET /api/v3/public/menu`, без Bearer token. Ответ и точные схемы принадлежат [OpenAPI](../../backend/openapi/openapi.json), HTTP-граница — [controller](../../backend/src/catalog/transport/public-menu-v3.controller.ts).

У товара одна цена с nullable `portionLabel` либо упорядоченные `priceChoices` с id, ценой, подписью и доступностью. Категории и модификаторы входят в публичную проекцию. `portionLabel` — текст для отображения, а не величина для расчёта.

Удалённый v2 menu/product API не имеет alias. Граница замены и удалённые поля — [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md); общая модель — [каталог](../30-domain/Catalog-and-menu.md).

Группы товара получаются только из назначений его категории. Опции упорядочены
по сохранённому порядку и ID; первая текущая опция имеет isDefault=true независимо
от цены. Доступность не меняет порядок/default. Первоначальный выбор клиента —
[конфигурация товара](../30-domain/Product-configuration.md).
