# E06 — Управление меню

Статус: complete.

E06 реализует управление каталогом для Administrator: категории, товары,
размеры и цены, агрегаты групп добавок с вариантами, назначения категориям,
архивирование, порядок, аудит и серверные ошибки полей. Оперативная
доступность и приём заказов принадлежат [[../E11/backend/BL-0138|E11]].

## backend

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[backend/BL-0083]] | complete | [API категорий](../../../../backend/src/catalog/transport/catalog-categories.controller.ts) |
| [[backend/BL-0084]] | complete | [API товаров](../../../../backend/src/catalog/transport/catalog-products.controller.ts) |
| [[backend/BL-0085]] | complete | [Правила товаров](../../../../backend/src/catalog/domain/product-admin.policy.ts) |
| [[backend/BL-0086]] | complete | [Правила групп](../../../../backend/src/catalog/domain/modifier-admin.policy.ts) |
| [[backend/BL-0087]] | complete | [API вариантов добавок](../../../../backend/src/catalog/transport/catalog-modifiers.controller.ts) |
| [[backend/BL-0088]] | complete | [Назначения категориям](../../../../backend/src/catalog/transport/catalog-category-modifiers.controller.ts) |
| [[backend/BL-0089]] | complete | [Миграция аудита](../../../../backend/migrations/0005_e06_catalog_admin.sql) и [E2E](../../../../backend/test/e2e/admin-catalog.e2e-spec.ts) |

## back-office

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[back-office/BL-0090]] | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [[back-office/BL-0091]] | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [[back-office/BL-0092]] | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [[back-office/BL-0093]] | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [[back-office/BL-0094]] | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [[back-office/BL-0095]] | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [[back-office/BL-0096]] | complete | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |

## quality

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[quality/BL-0097]] | complete | [Сквозной Chromium-сценарий](../../../../back-office/tests/e2e/catalog.e2e.ts) и [CI](../../../../.github/workflows/back-office-ci.yml) |
