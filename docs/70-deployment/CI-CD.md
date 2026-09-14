---
title: CI и поставка
type: operations
owner: root
last_verified: 2026-09-14
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/delivery-ci.yml
  - ../../deploy/deploy.sh
---

# CI и поставка

Поддерживаемая поставка — development из `main`. Workflow собирает образы и
передаёт их в `deploy/deploy.sh`; статическая проверка поставки выполняется
`delivery-ci.yml`. Staging и production не входят в поддерживаемый путь до
отдельного решения о постоянных данных.

Перед запуском deploy проверяет входные секреты, образы и compose-конфигурацию.
Затем development PostgreSQL пересоздаётся, backend применяет `schema.sql`,
выполняется детерминированный seed и проверяется health трёх сервисов.
Миграций, backfill, backup/restore и автоматического E2E-gate нет.
