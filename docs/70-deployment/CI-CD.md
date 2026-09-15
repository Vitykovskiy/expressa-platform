---
title: CI и поставка
type: operations
owner: root
last_verified: 2026-09-14
sources:
  - ../../.husky/pre-push
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/delivery-ci.yml
  - ../../deploy/deploy.sh
---

# CI и поставка

Поддерживаемая поставка — development из `main`. Reusable CI для backend,
front-office и back-office собирает только соответствующие Docker image;
development delivery передаёт их в `deploy/deploy.sh`. `delivery-ci.yml`
проверяет документацию и статическую корректность deploy-скриптов. Husky
`pre-push` выполняет path-aware lint, typecheck и build.

До явной приёмки результата пользователем автоматизированные тесты не
создаются, не изменяются и не запускаются. Они не входят в pre-commit,
pre-push, CI или deployment-gate; после приёмки они допустимы только по
прямому запросу пользователя.

Staging и production не входят в поддерживаемый путь до отдельного решения о
постоянных данных.

Перед запуском deploy проверяет входные секреты, образы и compose-конфигурацию.
Затем development PostgreSQL пересоздаётся, backend применяет `schema.sql`,
выполняется детерминированный seed и проверяется health трёх сервисов.
Миграций, backfill, backup/restore и автоматического E2E-gate нет.
