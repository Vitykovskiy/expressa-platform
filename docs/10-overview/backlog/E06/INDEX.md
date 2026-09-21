# E06 — Управление меню

[К backlog](../INDEX.md).

Статус: complete.

E06 реализует управление каталогом для Administrator: категории, товары,
размеры и цены, агрегаты групп добавок с вариантами, назначения категориям,
архивирование, порядок, аудит и серверные ошибки полей. Оперативная
доступность и приём заказов принадлежат [E11](../E11/backend/BL-0138.md).

## [backend](backend/INDEX.md)

| Карточка                         | Статус                 | Доказательство                                                                                               |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| [BL-0083.md](backend/BL-0083.md) | complete               | [API категорий](../../../../backend/src/catalog/transport/catalog-categories.controller.ts)                  |
| [BL-0084.md](backend/BL-0084.md) | superseded by ADR-008  | [API товаров](../../../../backend/src/catalog/transport/catalog-products-v3.controller.ts)                   |
| [BL-0085.md](backend/BL-0085.md) | historical; superseded | [Текущая v3 policy — replacement provenance](../../../../backend/src/catalog/domain/product-admin.policy.ts) |
| [BL-0086.md](backend/BL-0086.md) | complete               | [Правила групп](../../../../backend/src/catalog/domain/modifier-admin.policy.ts)                             |
| [BL-0087.md](backend/BL-0087.md) | complete               | [API вариантов добавок](../../../../backend/src/catalog/transport/catalog-modifiers.controller.ts)           |
| [BL-0088.md](backend/BL-0088.md) | complete               | [Назначения категориям](../../../../backend/src/catalog/transport/catalog-category-modifiers.controller.ts)  |
| [BL-0089.md](backend/BL-0089.md) | complete               | [Текущая запись аудита товаров](../../../../backend/src/catalog/adapters/postgres-products.repository.ts)    |

## [back-office](back-office/INDEX.md)

| Карточка                             | Статус                | Доказательство                                                           |
| ------------------------------------ | --------------------- | ------------------------------------------------------------------------ |
| [BL-0090.md](back-office/BL-0090.md) | complete              | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0091.md](back-office/BL-0091.md) | complete              | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0092.md](back-office/BL-0092.md) | complete              | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0093.md](back-office/BL-0093.md) | superseded by ADR-008 | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0094.md](back-office/BL-0094.md) | complete              | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0095.md](back-office/BL-0095.md) | complete              | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |
| [BL-0096.md](back-office/BL-0096.md) | complete              | [Локальная документация каталога](../../../../back-office/docs/INDEX.md) |

## quality

| Карточка                         | Статус                | Доказательство                                                                                                                                 |
| -------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [BL-0097.md](quality/BL-0097.md) | superseded by ADR-008 | [Ручная приёмка пользовательских потоков](../../../95-testing/Mandatory-scenarios.md) и [CI](../../../../.github/workflows/back-office-ci.yml) |
