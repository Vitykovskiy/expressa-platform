---
title: Топология поставки development
description: Одноразовая development-среда без сохранения данных.
type: adr
area: architecture
status: accepted
owner: root
last_verified: 2026-09-14
tags: [expressa, delivery, deployment]
updated: 2026-09-14
sources:
  - ../../../.github/workflows/development-delivery.yml
  - ../../../deploy/deploy.sh
---

# ADR-002: топология поставки development

Поддерживается только development-поставка из `main`. Она использует отдельный
Compose project `expressa-development`; каждая поставка пересоздаёт PostgreSQL,
применяет `backend/schema.sql` и запускает seed. Это соответствует тестовой
одноразовой базе и не сохраняет данные между поставками.

Staging и production, перенос данных, миграции, backfill и backup/restore не
являются поддерживаемыми путями до отдельного архитектурного решения.
