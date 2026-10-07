---
title: "Управление каталогом"
type: domain
owner: back-office
last_verified: 2026-10-08
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/catalog.api.ts
knowledge_role: implementation
scope: back-office
---

# Управление каталогом

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

Чтение каталога и команды товаров используют v3; категории и группы модификаторов остаются текущими v2 API. HTTP-границу задают [catalog API](../../src/shared/api/catalog.api.ts) и [OpenAPI](../../contracts/openapi.json); полный маршрут — [staff API](../../../docs/50-interfaces/Back-office-API.md).

Товар имеет одну цену либо `priceChoices`; удалённой модели вариантов S/M/L нет. При создании товара сохранённые варианты цены показаны строками: ниже 600 px — компактная двухстрочная композиция, от 600 px — таблица. Добавление или редактирование открывает отдельный диалог; доступность остаётся в строке. Владельцы: [AddProductDialog](../../src/pages/admin/menu/AddProductDialog.vue) и [PriceChoiceDialog](../../src/pages/admin/menu/PriceChoiceDialog.vue).

Запросы и канонический каталог принадлежат [catalog store](../../src/pages/admin/menu/catalog.store.ts); детали сценария — [управление меню](../../../docs/40-features/Manage-menu.md). Наличие исходников не означает выполненную визуальную приёмку.
