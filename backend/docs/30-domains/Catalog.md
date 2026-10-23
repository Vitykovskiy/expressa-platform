---
title: "Каталог"
type: domain
owner: backend
last_verified: 2026-10-23
sources:
  - ../../openapi/openapi.json
  - ../../src/catalog/transport/public-menu-v3.controller.ts
  - ../../src/catalog/transport/catalog-products-v3.controller.ts
  - ../../src/catalog/transport/source-menu.controller.ts
  - ../../src/catalog/application/manage-source-products.use-case.ts
  - ../../src/catalog/adapters/postgres-products.repository.ts
knowledge_role: implementation
scope: backend
---

# Каталог

Публичное меню, чтение административного каталога и команды товаров работают в v3. Управление категориями и модификаторами сохраняется в v2. Точная граница версий — [ADR-008](../../../docs/20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md), методы и схемы — [OpenAPI](../../openapi/openapi.json).

Товар имеет одну цену с nullable `portionLabel` или упорядоченные `priceChoices`; модель вариантов S/M/L удалена. Владельцы HTTP-границы: [публичное меню](../../src/catalog/transport/public-menu-v3.controller.ts) и [команды товаров](../../src/catalog/transport/catalog-products-v3.controller.ts). Общая семантика — [каталог и меню](../../../docs/30-domain/Catalog-and-menu.md).

## Атомарные команды source-форм

Контракт `/api/v3/backoffice/menu/*` задаёт
[ADR-012](../../../docs/20-architecture/ADR/ADR-012-back-office-source-contract.md).
Действующие `/catalog/*` и v2-команды сохраняются. Чтение остаётся
`GET /api/v3/backoffice/catalog`; отдельного дерева хранения нет.

Новые команды сохраняют категорию вместе с явной заменой её связей, создают и
переименовывают группы, добавляют и редактируют опции, создают и редактируют
товары. Серверные defaults и сохранение скрытых полей описаны в
[общем контракте](../../../docs/30-domain/Catalog-and-menu.md#команды-диалогов-back-office).
Авторизация — только Administrator; actor берётся из проверенного сеанса.
Один `PostgresCatalogCommandRunner` обеспечивает общий advisory lock,
транзакцию и аудит. Ошибка проверки, сохранения или аудита откатывает всю команду.
Новые команды не требуют изменения schema.sql.

HTTP-валидация отделяет неверный JSON-контракт от предметного отказа; текущие
ошибки CATEGORY/PRODUCT/MODIFIER сохраняются. Отсутствующая сущность даёт 404,
архивная — 409; повреждённая ценовая ветвь и чужие ID опций — 400.
OpenAPI и клиентские snapshots обновляет владелец итоговой интеграции после
регистрации всех маршрутов; документация не означает runtime-приёмку.

## Собственные группы товара

Source-команда товара принимает дополнительный необязательный
`modifierGroupIds: uuid[]`. При создании отсутствие означает пустой набор,
при редактировании сохраняет все текущие связи. Явный массив заменяет только
собственные связи товара, не связи его категории; порядок массива задаёт
`sort_order`. Повторные, некорректные, отсутствующие или архивные ID в явно
переданном наборе отклоняются до записи. Продукт, связи и аудит до/после
фиксируются одной существующей транзакцией и advisory lock каталога.

Административное чтение дополнено `productModifierGroups` со строками
`{productId, groupId, sortOrder}`. Source-ответ товара дополнен
`modifierGroupIds`; остальные поля сохранены. Полные v3-команды товара не
заменяют связи. Публичное меню уже объединяет наследуемые и собственные группы
по ID, без дублирования; серверная проверка заказа использует эти реальные связи.
Schema.sql и seed не меняются.

UI сохраняет всю группу опций существующим POST
`/api/v2/backoffice/catalog/modifier-groups` или PATCH
`/api/v2/backoffice/catalog/modifier-groups/{groupId}`: имя, ограничения выбора,
активность и опции с ценами/default/доступностью/ID/порядком. Существующий
`assertModifierGroupAggregate` остаётся владельцем предметной допустимости.
Создание обязательной группы не разбивается на промежуточную пустую группу
и отдельные записи опций.
