---
title: Каталог и управление меню
type: feature
owner: backend
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/catalog/catalog.module.ts
  - ../../src/catalog/application/manage-products.use-case.ts
  - ../../migrations/0004_e05_catalog.sql
---

# Каталог

Публичное `GET /public/menu` выдаёт только опубликованное вложенное меню.
Администратор читает полную проекцию и создаёт, меняет, переупорядочивает или
архивирует категории, товары, группы/варианты модификаторов и связи категории.
[Публичный controller](../../src/catalog/transport/public-menu.controller.ts),
[админ-controller](../../src/catalog/transport/admin-catalog.controller.ts).

Use case проверяет допустимость до записи: имя и порядок, тип и цены товара,
варианты напитка, состав и выбор модификаторов; архивные сущности не меняются.
Полная перестановка принимает ровно текущий набор идентификаторов. [Категории](../../src/catalog/domain/category-admin.policy.ts),
[товары](../../src/catalog/domain/product-admin.policy.ts),
[модификаторы](../../src/catalog/domain/modifier-admin.policy.ts).

Каждая команда выполняется в `BEGIN`/advisory lock/`COMMIT` и записывает audit
до фиксации; ошибка откатывает транзакцию. PostgreSQL поддерживает уникальные
активные позиции, ссылки и ограничения типов/цен. [Command runner](../../src/catalog/adapters/postgres-catalog-command.runner.ts),
[схема](../../migrations/0004_e05_catalog.sql), [аудит](../../migrations/0005_e06_catalog_admin.sql).

HTTP-валидация возвращает структурированные поля, предметные конфликты не
маскируются. Контракт маршрутов — [карта API](../50-api/_MOC-api.md); unit,
repository и e2e проверяют правила, SQL и публикацию. [validation](../../src/catalog/transport/catalog-validation-http.spec.ts),
[e2e](../../test/e2e/admin-catalog.e2e-spec.ts).
