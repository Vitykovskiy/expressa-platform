---
title: "API back-office"
type: interface
owner: root
last_verified: 2026-10-21
sources:
  - ../20-architecture/ADR/ADR-012-back-office-source-contract.md
  - ../../backend/openapi/openapi.json
  - ../../backend/src/catalog/transport/admin-catalog-v3.controller.ts
  - ../../backend/src/catalog/transport/catalog-products-v3.controller.ts
  - ../../backend/src/orders/transport/backoffice-orders-v3.controller.ts
  - ../../backend/src/orders/transport/backoffice-orders.controller.ts
knowledge_role: implementation
scope: system
---

# API back-office

Источник HTTP-инвентаря — [OpenAPI](../../backend/openapi/openapi.json). Таблица перечисляет каждый back-office путь один раз. v2 ниже — сохранённый текущий API, не alias удалённого API.

| Метод и путь                                                                | Назначение                        | Runtime                                    |
| --------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------ |
| `GET /api/v3/backoffice/catalog`                                            | читать каталог                    | `admin-catalog-v3.controller.ts`           |
| `POST /api/v3/backoffice/catalog/products`                                  | создать товар                     | `catalog-products-v3.controller.ts`        |
| `PATCH /api/v3/backoffice/catalog/products/{productId}`                     | изменить товар                    | `catalog-products-v3.controller.ts`        |
| `DELETE /api/v3/backoffice/catalog/products/{productId}`                    | архивировать товар                | `catalog-products-v3.controller.ts`        |
| `POST /api/v3/backoffice/catalog/products/reorder`                          | изменить порядок товаров          | `catalog-products-v3.controller.ts`        |
| `PATCH /api/v3/backoffice/availability/price-choice/{id}`                   | изменить доступность price choice | `backoffice-availability-v3.controller.ts` |
| `GET /api/v3/backoffice/orders`                                             | читать очередь заказов            | `backoffice-orders-v3.controller.ts`       |
| `GET /api/v3/backoffice/orders/{orderId}`                                   | читать заказ                      | `backoffice-orders-v3.controller.ts`       |
| `POST /api/v2/backoffice/catalog/categories`                                | создать категорию                 | `catalog-categories.controller.ts`         |
| `PATCH /api/v2/backoffice/catalog/categories/{categoryId}`                  | изменить категорию                | `catalog-categories.controller.ts`         |
| `DELETE /api/v2/backoffice/catalog/categories/{categoryId}`                 | архивировать категорию            | `catalog-categories.controller.ts`         |
| `POST /api/v2/backoffice/catalog/categories/reorder`                        | изменить порядок категорий        | `catalog-categories.controller.ts`         |
| `PUT /api/v2/backoffice/catalog/categories/{categoryId}/modifier-groups`    | заменить назначения групп         | `catalog-category-modifiers.controller.ts` |
| `POST /api/v2/backoffice/catalog/modifier-groups`                           | создать группу                    | `catalog-modifiers.controller.ts`          |
| `PATCH /api/v2/backoffice/catalog/modifier-groups/{groupId}`                | изменить группу                   | `catalog-modifiers.controller.ts`          |
| `DELETE /api/v2/backoffice/catalog/modifier-groups/{groupId}`               | архивировать группу               | `catalog-modifiers.controller.ts`          |
| `POST /api/v2/backoffice/catalog/modifier-groups/{groupId}/options`         | создать option                    | `catalog-modifiers.controller.ts`          |
| `PATCH /api/v2/backoffice/catalog/modifier-groups/options/{optionId}`       | изменить option                   | `catalog-modifiers.controller.ts`          |
| `DELETE /api/v2/backoffice/catalog/modifier-groups/options/{optionId}`      | архивировать option               | `catalog-modifiers.controller.ts`          |
| `POST /api/v2/backoffice/catalog/modifier-groups/{groupId}/options/reorder` | изменить порядок options          | `catalog-modifiers.controller.ts`          |
| `GET /api/v2/backoffice/availability`                                       | читать доступность                | `backoffice-availability.controller.ts`    |
| `PATCH /api/v2/backoffice/availability/{type}/{id}`                         | изменить доступность              | `backoffice-availability.controller.ts`    |
| `PATCH /api/v2/backoffice/service/intake`                                   | изменить приём заказов            | `backoffice-availability.controller.ts`    |
| `POST /api/v2/backoffice/orders/{orderId}/accept`                           | принять заказ                     | `backoffice-orders.controller.ts`          |
| `POST /api/v2/backoffice/orders/{orderId}/start-preparing`                  | начать готовить                   | `backoffice-orders.controller.ts`          |
| `POST /api/v2/backoffice/orders/{orderId}/mark-ready`                       | отметить готовым                  | `backoffice-orders.controller.ts`          |
| `POST /api/v2/backoffice/orders/{orderId}/issue`                            | выдать заказ                      | `backoffice-orders.controller.ts`          |

`GET /api/v2/backoffice/orders` и `GET /api/v2/backoffice/orders/{orderId}` удалены. Чтение очереди и детали существует только под v3.

## Source API полного back-office

[ADR-012](../20-architecture/ADR/ADR-012-back-office-source-contract.md)
задаёт целевые source-политики. Ниже перечислены опубликованные в текущем
OpenAPI дополнительные операции. AppModule подключает StaffUsersModule и
ServiceSettingsModule; SourceMenuController и source-ready/reject принадлежат
существующим CatalogModule и OrdersModule. У всех новых административных
команд действуют SessionGuard/RolesGuard: users/settings/menu — Administrator,
заказы — Staff. Генерация OpenAPI не заменяет проверку фактической авторизации.

| Метод и путь                                                   | HTTP-вход                      |
| -------------------------------------------------------------- | ------------------------------ |
| `POST /api/v3/backoffice/menu/categories`                      | `SourceMenuController`         |
| `PATCH /api/v3/backoffice/menu/categories/{categoryId}`        | `SourceMenuController`         |
| `POST /api/v3/backoffice/menu/option-groups`                   | `SourceMenuController`         |
| `PATCH /api/v3/backoffice/menu/option-groups/{groupId}`        | `SourceMenuController`         |
| `POST /api/v3/backoffice/menu/option-groups/{groupId}/options` | `SourceMenuController`         |
| `PATCH /api/v3/backoffice/menu/options/{optionId}`             | `SourceMenuController`         |
| `POST /api/v3/backoffice/menu/products`                        | `SourceMenuController`         |
| `PATCH /api/v3/backoffice/menu/products/{productId}`           | `SourceMenuController`         |
| `POST /api/v3/backoffice/orders/{orderId}/ready`               | `BackofficeOrdersV3Controller` |
| `POST /api/v3/backoffice/orders/{orderId}/reject`              | `BackofficeOrdersV3Controller` |
| `GET /api/v3/backoffice/users`                                 | `StaffUsersController`         |
| `POST /api/v3/backoffice/users`                                | `StaffUsersController`         |
| `PATCH /api/v3/backoffice/users/{userId}/role`                 | `StaffUsersController`         |
| `PATCH /api/v3/backoffice/users/{userId}/block`                | `StaffUsersController`         |
| `GET /api/v3/backoffice/settings`                              | `OperatingSettingsController`  |
| `PUT /api/v3/backoffice/settings`                              | `OperatingSettingsController`  |

Клиентские снимки генерируются существующей командой backend `openapi:sync`.
В схеме заказов опубликованы реальные nullable pickupSlot/rejection и имя
клиента в staff-проекции; view-фильтр — new/confirmed/ready/all. Customer-поля
добавлены опционально для совместимости. Пять стадий и все старые endpoint
сохранены. Публичное наличие маршрутов и схем не подтверждает UI-приёмку,
проверку конкурентных операций или development-поставку.
