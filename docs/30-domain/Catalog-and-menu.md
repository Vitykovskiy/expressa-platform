---
title: Каталог и меню
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/docs/30-domains/Catalog.md
---

# Каталог и меню

Каталог объединяет категории, товары `DRINK`/`OTHER`, варианты напитков,
группы/варианты модификаторов и назначения групп категориям. Публичное меню —
отдельная вложенная проекция, а административный каталог — полный набор для
управления. [Backend catalog](../../backend/docs/30-domains/Catalog.md),
[OpenAPI](../../backend/openapi/openapi.json).

Публикация требует активных, неархивных и допустимых сущностей: напиток имеет
доступный вариант, `OTHER` — собственную цену, обязательная группа — корректный
набор default-вариантов. [Public repository](../../backend/src/catalog/adapters/postgres-public-menu.repository.ts),
[catalog schema](../../backend/migrations/0004_e05_catalog.sql).

Administrator управляет каталогом через `/api/v2/backoffice/catalog/*`; каждая
команда проверяет правила, выполняется с audit в транзакции и сериализует
конкурирующие изменения каталога. [Catalog commands](../../backend/docs/30-domains/Catalog.md),
[command runner](../../backend/src/catalog/adapters/postgres-catalog-command.runner.ts).
