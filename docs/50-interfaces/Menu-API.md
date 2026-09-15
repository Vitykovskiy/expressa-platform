---
title: API меню
type: interface
owner: root
last_verified: 2026-09-14
sources:
  - ../../backend/src/catalog/transport/public-menu.controller.ts
  - ../../backend/openapi/openapi.json
  - ../../front-office/src/features/menu/ProductDetailScreen.vue
  - ../20-architecture/ADR/ADR-006-product-variant-portions.md
---

# API меню

`GET /api/v2/public/menu` доступен без Bearer token и возвращает публичную
проекцию категорий, товаров, вариантов, модификаторов и `acceptsNewOrders`.
Схемы, поля и ответы принадлежат [OpenAPI](../../backend/openapi/openapi.json);
HTTP-вход — [PublicMenuController](../../backend/src/catalog/transport/public-menu.controller.ts).

У товара и варианта в текущем runtime дополнительно может быть nullable
`displayLabel`. Клиент показывает строковое значение как физический объём или
порцию, сохраняя fallback к `S`/`M`/`L`. Текущий OpenAPI ошибочно описывает
`displayLabel` варианта как object; это дефект текущего v2-описания, а не
основание для формы будущего контракта.

Ответ публичного меню отправляется с `Cache-Control: no-store`, чтобы клиент
не показывал каталог предыдущего deploy.

Административное чтение и команды каталога находятся под
`/api/v2/backoffice/catalog/*`, требуют administrator и не заменяют публичную
проекцию. [API map](../../backend/docs/50-api/_MOC-api.md),
[admin controller](../../backend/src/catalog/transport/admin-catalog.controller.ts).

Клиенты используют свои OpenAPI snapshots и проверяют их синхронизацию;
детали экранов и состояния принадлежат локальным нотам. [Контракт](../20-architecture/Cross-repository-contracts.md),
[front](../../front-office/docs/30-features/Menu-and-configuration.md), [back](../../back-office/docs/30-domains/Catalog-management.md).

## Принятый контракт v3

Решение [ADR-006](../20-architecture/ADR/ADR-006-product-variant-portions.md)
оставляет разрыв текущих menu/catalog/order-представлений в `/api/v3`, но
заменяет прежнюю типизированную порцию двумя простыми формами товара:

- одна цена: `price`, nullable `portionLabel`, пустой `priceChoices`;
- несколько цен: `price` и `portionLabel` товара равны `null`, а
  `priceChoices` содержит минимум два упорядоченных элемента с `id`,
  обязательным `portionLabel`, `price` и `isAvailable`.

Каждый товар v3 также содержит `modifierGroups`: применимые активные группы с
текущими options. Их состав и допустимость совпадают с публичной проекцией v2:
архивированные группы и options не публикуются, а некорректная обязательная
группа не даёт опубликовать категорию. Группа `Сладость` для «Какао» и группа
`Сахар` для чая и кофе приходят здесь как обязательные single-choice группы с
бесплатным доступным вариантом по умолчанию. Клиент отправляет выбранные option
IDs в уже существующем составе позиции заказа.

Порядок массива задаёт показ и первый доступный выбор; поле default
отсутствует. `portionLabel` — непрозрачный текст. API не принимает и не
возвращает вид порции, числовое значение, единицу или данные запаса. UI-подсказки
`200 мл`, `250 мл`, `300 мл`, `350 мл`, `400 мл`, `450 мл` не входят в wire
contract и сохраняются как обычная строка.

Создание заказа для одной цены передаёт `productId` без `priceChoiceId`; для
нескольких цен `priceChoiceId` обязателен. Позиция ответа содержит сохранённые
на момент заказа nullable `priceChoiceId`, nullable `portionLabel` и цену.
Customer history и staff читают этот снимок, а не текущий каталог.

Текущий `/api/v2` и OpenAPI остаются источником факта до согласованного
переключения. Частичный `/api/v3` не считается реализованным контрактом, пока
schema, menu, admin, orders и все клиенты не приведены к ADR. Правила ошибок,
совместимости и отключения v2 должны быть зафиксированы в контурной
документации и плане выпуска до cutover; прежнее неподтверждённое 30-дневное
окно не является требованием этого решения.
