---
title: "Рабочие области и маршруты"
type: domain
owner: back-office
last_verified: 2026-10-08
sources:
  - ../../src/app/router.ts
  - ../../contracts/openapi.json
knowledge_role: implementation
scope: back-office
---

# Рабочие области и маршруты

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

Маршруты и ролевые ограничения определяет [router.constants.ts](../../src/app/router.constants.ts), восстановление сессии и перенаправления — [router.ts](../../src/app/router.ts).

| Маршрут                          | Назначение                              | Роль                             |
| -------------------------------- | --------------------------------------- | -------------------------------- |
| `/login`                         | Вход сотрудника                         | Неаутентифицированный посетитель |
| `/queue`                         | Очередь, детали и переходы стадий       | Barista, administrator           |
| `/availability`                  | Оперативная доступность и приём заказов | Barista, administrator           |
| `/menu`                          | Административный каталог                | Administrator                    |
| `/menu/products/:productId/edit` | Редактирование товара                   | Administrator                    |

Административный каталог и товары используют v3; категории / модификаторы — v2. Очередь читается через v3, переходы стадий — через v2. Доступность и приём используют сохранённые v2 операции, доступность ценовой опции — v3. Точные пути находятся в [OpenAPI](../../contracts/openapi.json) и [карте staff API](../../../docs/50-interfaces/Back-office-API.md).

Связанное: [вход и роли](Authentication-and-role-gates.md), [каталог](Catalog-management.md), [активные и неподключённые экраны](Inactive-screens.md).
