---
title: "Каталог и меню"
type: domain
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
knowledge_role: implementation
scope: system
---

# Каталог и меню

Публичное меню, чтение административного каталога и команды товаров работают только через v3 API. Категории и группы модификаторов используют текущие v2 операции. Методы и схемы — [OpenAPI](../../backend/openapi/openapi.json).

Товар имеет одну цену с необязательной подписью порции либо упорядоченные `priceChoices`. Модель вариантов S/M/L удалена. Полная граница замены — [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md); конфигурация позиции — [отдельный контракт](Product-configuration.md).
