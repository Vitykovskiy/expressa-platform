---
title: Данные development
type: operations
owner: root
last_verified: 2026-09-14
sources:
  - ../../deploy/deploy.sh
  - ../../backend/schema.sql
---

# Данные development

Development не хранит данные между поддерживаемыми поставками. `deploy.sh`
пересоздаёт PostgreSQL, после чего backend применяет `schema.sql` и seed.
Поэтому backup, restore, миграции и backfill для development не поддерживаются.
Постоянные среды появятся только после отдельного решения о модели данных.
