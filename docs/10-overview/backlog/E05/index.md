# E05 — Каталог и публичное меню

Статус: complete.

E05 реализует публичный каталог и его просмотр. Управление меню принадлежит
[[../E06/backend/BL-0083|E06]], создание заказа — [[../E07/backend/BL-0099|E07]],
оперативная доступность — [[../E11/backend/BL-0138|E11]].

## backend

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[backend/BL-0075]] | complete | [Миграция схемы](../../../../backend/migrations/0004_e05_catalog.sql) и [интеграционная проверка](../../../../backend/test/integration/catalog-schema.integration.spec.ts) |
| [[backend/BL-0076]] | complete | [Интеграционная проверка публикации](../../../../backend/test/integration/public-menu-repository.integration.spec.ts) |
| [[backend/BL-0077]] | complete | [OpenAPI публичного меню](../../../../backend/openapi/openapi.json) и [E2E](../../../../backend/test/e2e/public-menu.e2e-spec.ts) |

## front-office

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[front-office/BL-0078]] | complete | [Клиент публичного меню и тесты](../../../../front-office/src/shared/api/public-menu.api.spec.ts) |
| [[front-office/BL-0079]] | complete | [Интеграция MenuPage](../../../../front-office/src/pages/MenuPage.spec.ts) |
| [[front-office/BL-0080]] | complete | [Правила конфигурации товара](../../../../front-office/src/customer/pages/menu/product-configuration.spec.ts) |
| [[front-office/BL-0081]] | complete | [Возврат и прокрутка MenuFlow](../../../../front-office/src/customer/pages/menu/MenuFlow.spec.ts) |

## quality

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[quality/BL-0082]] | complete | [Браузерный сценарий меню](../../../../front-office/tests/e2e/menu.e2e.spec.ts) |
