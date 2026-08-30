# E06 — Управление меню

[К backlog](../INDEX.md).

Статус: complete.

E06 реализует управление каталогом для Administrator: категории, товары,
размеры и цены, агрегаты групп добавок с вариантами, назначения категориям,
архивирование, порядок, аудит и серверные ошибки полей. Оперативная
доступность и приём заказов принадлежат [E11](../E11/backend/BL-0138.md).

## [backend](backend/INDEX.md)

| Карточка                         | Статус   | Доказательство                                                                                                                               |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [BL-0083.md](backend/BL-0083.md) | complete | [API категорий](../../../../backend/src/catalog/transport/catalog-categories.controller.ts)                                                  |
| [BL-0084.md](backend/BL-0084.md) | complete | [API товаров](../../../../backend/src/catalog/transport/catalog-products.controller.ts)                                                      |
| [BL-0085.md](backend/BL-0085.md) | complete | [Правила товаров](../../../../backend/src/catalog/domain/product-admin.policy.ts)                                                            |
| [BL-0086.md](backend/BL-0086.md) | complete | [Правила групп](../../../../backend/src/catalog/domain/modifier-admin.policy.ts)                                                             |
| [BL-0087.md](backend/BL-0087.md) | complete | [API вариантов добавок](../../../../backend/src/catalog/transport/catalog-modifiers.controller.ts)                                           |
| [BL-0088.md](backend/BL-0088.md) | complete | [Назначения категориям](../../../../backend/src/catalog/transport/catalog-category-modifiers.controller.ts)                                  |
| [BL-0089.md](backend/BL-0089.md) | complete | [Миграция аудита](../../../../backend/migrations/0005_e06_catalog_admin.sql) и [E2E](../../../../backend/test/e2e/admin-catalog.e2e-spec.ts) |

## [back-office](back-office/INDEX.md)

| Карточка                             | Статус   | Доказательство                                                           |
| ------------------------------------ | -------- | ------------------------------------------------------------------------ |
| [BL-0090.md](back-office/BL-0090.md) | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0091.md](back-office/BL-0091.md) | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0092.md](back-office/BL-0092.md) | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0093.md](back-office/BL-0093.md) | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0094.md](back-office/BL-0094.md) | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0095.md](back-office/BL-0095.md) | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0096.md](back-office/BL-0096.md) | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |

## quality

| Карточка                         | Статус   | Доказательство                                                                                                                          |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [BL-0097.md](quality/BL-0097.md) | complete | [Сквозной Chromium-сценарий](../../../../back-office/tests/e2e/catalog.e2e.ts) и [CI](../../../../.github/workflows/back-office-ci.yml) |
