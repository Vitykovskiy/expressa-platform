---
title: Конфигурация товара
type: domain
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/src/orders/domain/order-revalidation.ts
  - ../../backend/openapi/openapi.json
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
---

# Конфигурация товара

Конфигурация позиции содержит товар, nullable `priceChoiceId` и выбранные modifier options. Для одной цены `priceChoiceId` отсутствует; для набора `priceChoices` выбранный id обязателен. Backend сверяет доступность, цену и modifiers при `POST /api/v3/orders`; клиентский итог не источник цены.

`portionLabel` — снимок текстовой подписи цены. `variant`, `S/M/L`, `variantId`, `size` и `pricingMode` не существуют. Повтор не подменяет archived/absent/unavailable price choice совпадающим текстом. Нормативная граница — [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md).
