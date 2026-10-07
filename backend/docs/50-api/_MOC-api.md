---
title: "HTTP-запрос через backend"
type: moc
area: backend
status: current
owner: backend
last_verified: 2026-08-11
sources:
  - ../../src/platform/observability/unified-exception.filter.ts
knowledge_role: navigation
scope: backend
---

# HTTP-запрос через backend

[Карта API](INDEX.md) ведёт к [OpenAPI](../../openapi/openapi.json): это полный перечень методов, путей, ролей и схем. Эта нота связывает транспортную границу с её предметными владельцами.

| Область                           | Предметный владелец                                 | HTTP-вход                                                                                                                                                                                                                                        |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OTP, сессия, текущий пользователь | [Auth](../30-domains/Auth.md)                       | [AuthController](../../src/auth/transport/auth.controller.ts), [MeController](../../src/auth/transport/me.controller.ts)                                                                                                                         |
| Публичное меню и каталог          | [Catalog](../30-domains/Catalog.md)                 | [Публичное меню](../../src/catalog/transport/public-menu-v3.controller.ts), [admin read](../../src/catalog/transport/admin-catalog-v3.controller.ts), [product commands](../../src/catalog/transport/catalog-products-v3.controller.ts)          |
| Категории и модификаторы          | [Catalog](../30-domains/Catalog.md)                 | [Категории](../../src/catalog/transport/catalog-categories.controller.ts), [модификаторы](../../src/catalog/transport/catalog-modifiers.controller.ts), [назначение групп](../../src/catalog/transport/catalog-category-modifiers.controller.ts) |
| Заказы покупателя и сотрудника    | [Orders](../30-domains/Orders.md)                   | [Customer](../../src/orders/transport/orders-v3.controller.ts), [staff reads](../../src/orders/transport/backoffice-orders-v3.controller.ts), [staff transitions](../../src/orders/transport/backoffice-orders.controller.ts)                    |
| Push-привязки                     | [Notifications](../30-domains/Notifications.md)     | [Controller](../../src/notifications/transport/push-subscriptions.controller.ts)                                                                                                                                                                 |
| Health                            | [Операции](../60-operations/Run-and-environment.md) | [Health controller](../../src/platform/health/health.controller.ts)                                                                                                                                                                              |

`SessionGuard` проверяет защищённую сессию; отдельные guards определяют роли. [Session guard](../../src/auth/transport/session.guard.ts). Ошибки нормализует [filter](../../src/platform/observability/unified-exception.filter.ts) в [HTTP DTO](../../src/platform/observability/http-error.dto.ts). Межконтурное описание — [модель ошибок](../../../docs/50-interfaces/Error-model-and-idempotency.md).
