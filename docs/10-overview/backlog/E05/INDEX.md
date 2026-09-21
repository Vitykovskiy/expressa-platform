# E05 — Каталог и публичное меню

[К backlog](../INDEX.md).

Статус: complete.

E05 реализует публичный каталог и его просмотр. Управление меню принадлежит
[E06](../E06/backend/BL-0083.md), создание заказа — [E07](../E07/backend/BL-0099.md),
оперативная доступность — [E11](../E11/backend/BL-0138.md).

## [backend](backend/INDEX.md)

| Карточка                         | Статус                | Доказательство                                                                                                                                                           |
| -------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [BL-0075.md](backend/BL-0075.md) | superseded by ADR-008 | [Миграция схемы](../../../../backend/schema.sql)                                                                                                                         |
| [BL-0076.md](backend/BL-0076.md) | superseded by ADR-008 | [Правила публикации v3](../../../../backend/docs/30-domains/Catalog.md)                                                                                                  |
| [BL-0077.md](backend/BL-0077.md) | complete              | [OpenAPI публичного меню](../../../../backend/openapi/openapi.json) и [проверка current schema](../../../../backend/test/integration/catalog-schema.integration.spec.ts) |

## [front-office](front-office/INDEX.md)

| Карточка                              | Статус   | Доказательство                                                                                    |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| [BL-0078.md](front-office/BL-0078.md) | complete | [Клиент публичного меню и тесты](../../../../front-office/src/shared/api/public-menu.api.spec.ts) |
| [BL-0079.md](front-office/BL-0079.md) | complete | [Интеграция MenuPage](../../../../front-office/src/pages/MenuPage.vue)                            |
| [BL-0080.md](front-office/BL-0080.md) | complete | [Локальная документация меню](../../../../front-office/docs/INDEX.md)                             |
| [BL-0081.md](front-office/BL-0081.md) | complete | [Локальная документация меню](../../../../front-office/docs/INDEX.md)                             |

## quality

| Карточка                         | Статус                | Доказательство                                                                        |
| -------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| [BL-0082.md](quality/BL-0082.md) | superseded by ADR-008 | [Ручная приёмка пользовательских потоков](../../../95-testing/Mandatory-scenarios.md) |
