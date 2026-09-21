---
title: v3 cutover каталога и заказов
type: adr
status: accepted
owner: root
date: 2026-09-20
last_verified: 2026-09-20
sources:
  - ../../../backend/openapi/openapi.json
  - ../../../backend/schema.sql
  - ../../../front-office/src/entities/customer/model/cart.store.ts
  - ADR-007-disposable-database-bootstrap.md
---

# ADR-008: v3 cutover каталога и заказов

## Решение

Это завершённый breaking cutover. Заменённые endpoint, модели и преобразование данных не поддерживаются.

Оставлены только следующие v3 API:

- `GET /api/v3/public/menu`;
- `GET /api/v3/backoffice/catalog`;
- `POST /api/v3/backoffice/catalog/products`, `PATCH`/`DELETE /api/v3/backoffice/catalog/products/{productId}` и `POST /api/v3/backoffice/catalog/products/reorder`;
- `PATCH /api/v3/backoffice/availability/price-choice/{id}`;
- `GET /api/v3/orders`, `GET /api/v3/orders/{orderId}`, `POST /api/v3/orders`, `POST /api/v3/orders/{orderId}/repeat`;
- `GET /api/v3/backoffice/orders`, `GET /api/v3/backoffice/orders/{orderId}`.

v2 сохранён только там, где путь действительно есть в OpenAPI: auth и `me`, категории и modifier groups, back-office availability и intake, четыре staff lifecycle transition (`accept`, `start-preparing`, `mark-ready`, `issue`), а также push public-key/inspect/association. Это текущие API, не временная compatibility прослойка.

Удалены v2 public menu, v2 product API, v2 customer/staff order reads и customer order commands, прямые push subscription routes. `variant`, `S/M/L`, `product_variants`, `variantId`, `size` и `pricingMode` удалены из schema, domain, OpenAPI и клиентов. Товар имеет одну цену с nullable `portionLabel` или упорядоченные `priceChoices` со стабильными id.

Старый ключ корзины `expressa.customer.cart` удаляется без чтения или преобразования; используется `expressa.customer.cart.v3`. Данные local, test и development намеренно уничтожаются и создаются текущими schema/seed. Такое удаление разрешено [ADR-007](ADR-007-disposable-database-bootstrap.md); migration, backfill, rollback и сохранение прежних данных не поддерживаются.

ADR-006 superseded этой записью; его исторический текст не является текущим контрактом.
