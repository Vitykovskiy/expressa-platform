# E05 — Каталог и публичное меню

[К backlog](../INDEX.md).

Статус: complete.

E05 реализует публичный каталог и его просмотр. Управление меню принадлежит
[E06](../E06/backend/BL-0083.md), создание заказа — [E07](../E07/backend/BL-0099.md),
оперативная доступность — [E11](../E11/backend/BL-0138.md).

## [backend](backend/INDEX.md)

| Карточка                         | Статус   | Доказательство                                                                                                                                                             |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BL-0075.md](backend/BL-0075.md) | complete | [Миграция схемы](../../../../backend/migrations/0004_e05_catalog.sql) и [интеграционная проверка](../../../../backend/test/integration/catalog-schema.integration.spec.ts) |
| [BL-0076.md](backend/BL-0076.md) | complete | [Интеграционная проверка публикации](../../../../backend/test/integration/public-menu-repository.integration.spec.ts)                                                      |
| [BL-0077.md](backend/BL-0077.md) | complete | [OpenAPI публичного меню](../../../../backend/openapi/openapi.json) и [E2E](../../../../backend/test/e2e/public-menu.e2e-spec.ts)                                          |

## [front-office](front-office/INDEX.md)

| Карточка                              | Статус   | Доказательство                                                                                    |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| [BL-0078.md](front-office/BL-0078.md) | complete | [Клиент публичного меню и тесты](../../../../front-office/src/shared/api/public-menu.api.spec.ts) |
| [BL-0079.md](front-office/BL-0079.md) | complete | [Интеграция MenuPage](../../../../front-office/src/pages/MenuPage.spec.ts)                        |
| [BL-0080.md](front-office/BL-0080.md) | complete | [Локальная документация меню](../../../../front-office/docs/INDEX.md)                             |
| [BL-0081.md](front-office/BL-0081.md) | complete | [Локальная документация меню](../../../../front-office/docs/INDEX.md)                             |

## quality

| Карточка                         | Статус   | Доказательство                                                                  |
| -------------------------------- | -------- | ------------------------------------------------------------------------------- |
| [BL-0082.md](quality/BL-0082.md) | complete | [Браузерный сценарий меню](../../../../front-office/tests/e2e/menu.e2e.spec.ts) |
