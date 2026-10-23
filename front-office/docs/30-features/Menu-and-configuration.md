---
title: "Меню и конфигурация товара"
type: feature
owner: front-office
last_verified: 2026-10-23
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/public-menu.api.ts
  - ../../src/features/menu/product-configuration.ts
knowledge_role: implementation
scope: front-office
---

# Меню и конфигурация товара

Меню читается только через `GET /api/v3/public/menu`; fallback к удалённому v2 меню отсутствует. Источники: [public-menu API](../../src/shared/api/public-menu.api.ts) и [OpenAPI](../../contracts/openapi.json).

Товар имеет одну цену или упорядоченные `priceChoices`. `portionLabel` — отображаемый текст; клиент не интерпретирует выбор как модель S/M/L. Подготовка позиции корзины принадлежит [product-configuration](../../src/features/menu/product-configuration.ts), контракт — [ADR-008](../../../docs/20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md).

Непустой список `priceChoices` может содержать одну опцию. Она остаётся
видимым выбором с реальным ID, подписью и ценой; клиент не добавляет другие
размеры и не превращает опцию в фиксированную цену. Пустые поля исходного
редактора не входят в публичное меню. Контракт уточнён в
[ADR-012](../../../docs/20-architecture/ADR/ADR-012-back-office-source-contract.md#одно-заполненное-значение-размера).

Группы наследуются только от категории. При открытии товара выбирается первая
опция каждой группы по серверному порядку, если доступна; при недоступной первой
автоматической замены нет. Это относится к single и multiple и включает платную
первую опцию в видимый итог один раз. Одиночный выбор заменяет предыдущую опцию;
множественный сохраняет независимые варианты в пределах серверных ограничений.
Правило — [конфигурация товара](../../../docs/30-domain/Product-configuration.md).
