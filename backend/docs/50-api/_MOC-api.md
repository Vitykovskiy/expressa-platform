---
title: HTTP API backend
type: moc
area: backend
status: current
owner: backend
last_verified: 2026-08-11
sources:
  - ../../src/platform/observability/unified-exception.filter.ts
---

# HTTP API

Машиночитаемый источник — [OpenAPI](../../openapi/openapi.json); `npm run
openapi:check` сверяет его с NestJS-декораторами. Предметные маршруты имеют
`/api/v1`, health остаётся вне версии. [HTTP config](../../src/platform/http/http-configuration.ts).

| Область | Маршруты | Владелец и первичный source |
| --- | --- | --- |
| Auth | `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/me` | [Auth](../30-domains/Auth.md); [auth controller](../../src/auth/transport/auth.controller.ts), [me controller](../../src/auth/transport/me.controller.ts), [OpenAPI](../../openapi/openapi.json) |
| Публичное меню | `GET /api/v1/public/menu` | [Catalog](../30-domains/Catalog.md); [controller](../../src/catalog/transport/public-menu.controller.ts), [OpenAPI](../../openapi/openapi.json) |
| Админ-каталог | `GET /api/v1/backoffice/catalog`; `POST /api/v1/backoffice/catalog/categories`; `PATCH /api/v1/backoffice/catalog/categories/{categoryId}`; `POST /api/v1/backoffice/catalog/categories/reorder`; `DELETE /api/v1/backoffice/catalog/categories/{categoryId}` | [Catalog](../30-domains/Catalog.md); [read controller](../../src/catalog/transport/admin-catalog.controller.ts), [category controller](../../src/catalog/transport/catalog-categories.controller.ts), [OpenAPI](../../openapi/openapi.json) |
| Товары | `POST /api/v1/backoffice/catalog/products`; `PATCH /api/v1/backoffice/catalog/products/{productId}`; `POST /api/v1/backoffice/catalog/products/reorder`; `DELETE /api/v1/backoffice/catalog/products/{productId}` | [Catalog](../30-domains/Catalog.md); [controller](../../src/catalog/transport/catalog-products.controller.ts), [OpenAPI](../../openapi/openapi.json) |
| Модификаторы | `POST /api/v1/backoffice/catalog/modifier-groups`; `PATCH /api/v1/backoffice/catalog/modifier-groups/{groupId}`; `DELETE /api/v1/backoffice/catalog/modifier-groups/{groupId}`; `POST /api/v1/backoffice/catalog/modifier-groups/{groupId}/options`; `PATCH /api/v1/backoffice/catalog/modifier-groups/options/{optionId}`; `POST /api/v1/backoffice/catalog/modifier-groups/{groupId}/options/reorder`; `DELETE /api/v1/backoffice/catalog/modifier-groups/options/{optionId}`; `PUT /api/v1/backoffice/catalog/categories/{categoryId}/modifier-groups` | [Catalog](../30-domains/Catalog.md); [modifier controller](../../src/catalog/transport/catalog-modifiers.controller.ts), [category-modifier controller](../../src/catalog/transport/catalog-category-modifiers.controller.ts), [OpenAPI](../../openapi/openapi.json) |
| Заказы | `POST /api/v1/orders` | [Orders](../30-domains/Orders.md); [controller](../../src/orders/transport/orders.controller.ts), [OpenAPI](../../openapi/openapi.json) |
| Health | `GET /health/live`, `GET /health/ready` | [Операции](../60-operations/Run-and-environment.md); [controller](../../src/platform/health/health.controller.ts), [OpenAPI](../../openapi/openapi.json) |

`SessionGuard` защищает bearer-маршруты; role guard допускает администратора к
каталогу и customer к заказам. Ошибки имеют `{ code, message, details,
requestId }`; validation может вернуть поля, внутренние детали не раскрываются.
[Guards](../../src/auth/transport/session.guard.ts), [filter](../../src/platform/observability/unified-exception.filter.ts),
[DTO](../../src/platform/observability/http-error.dto.ts).
