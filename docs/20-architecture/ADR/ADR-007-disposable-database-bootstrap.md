---
title: Одноразовые базы и текущая схема
type: adr
owner: root
last_verified: 2026-09-14
sources:
  - ../../../backend/schema.sql
  - ../../../backend/scripts/initialize-database.ts
  - ../../../backend/scripts/reset-test-database.ts
  - ../../../backend/scripts/seed.ts
  - ../../../deploy/deploy.sh
---

# ADR-007: Одноразовые базы и текущая схема

## Решение

Поддерживаются только одноразовые базы local, test и development. Каждое
поддерживаемое развёртывание пересоздаёт пустую базу из текущей
`backend/schema.sql`, затем запускает детерминированный seed.

`npm run db:init` применяет схему только к пустой базе и завершается ошибкой
для базы с прикладными таблицами. Он не выполняет удаление данных сам.

Истории миграций, backfill, rollback, сохранение данных и обновление
заполненной базы не поддерживаются. Отдельного E2E-набора и E2E-gate также
нет; пользовательские сценарии принимаются вручную в работающем приложении.

Staging и production исключены из поддерживаемого пути поставки. Их включение
или требование сохранения данных требует нового ADR с моделью эволюции,
резервного копирования и проверяемого перехода.

## Последствия

Развёртывание development намеренно удаляет все прежние строки базы. Это
подходит для текущей тестовой среды и не подходит для среды с ценными данными.
Единственный источник схемы — [schema.sql](../../../backend/schema.sql);
bootstrap реализуют [инициализатор](../../../backend/scripts/initialize-database.ts),
[reset test database](../../../backend/scripts/reset-test-database.ts),
[seed](../../../backend/scripts/seed.ts) и [development deploy](../../../deploy/deploy.sh).
