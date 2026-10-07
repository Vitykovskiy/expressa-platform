---
title: "Конфигурация товара"
type: domain
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/src/orders/domain/order-revalidation.ts
  - ../../backend/openapi/openapi.json
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
knowledge_role: implementation
scope: system
---

# Конфигурация товара

Позиция содержит товар, nullable `priceChoiceId` и выбранные опции модификаторов. Для одной цены выбор ценовой опции не нужен; для набора `priceChoices` id обязателен. Backend сверяет доступность, цену и модификаторы при создании заказа; клиентский итог не является источником цены. [Повторная проверка](../../backend/src/orders/domain/order-revalidation.ts), [OpenAPI](../../backend/openapi/openapi.json).

`portionLabel` сохраняет текстовую подпись цены. `variant`, `S/M/L`, `variantId`, `size` и `pricingMode` не являются полями текущей модели. Повтор не подменяет архивную, отсутствующую или недоступную ценовую опцию совпадающим текстом. Нормативная граница — [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md).
