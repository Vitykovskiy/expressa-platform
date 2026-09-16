---
title: Операционный запуск
type: operations
owner: root
last_verified: 2026-09-14
sources:
  - ../../deploy/deploy.sh
  - ../../deploy/compose.yml
  - ../../deploy/run-remote.sh
---

# Операционный запуск

Поддерживаемый запуск — `deploy.sh --environment development deploy all` через
development workflow. Скрипт читает VPS `runtime.env`, проверяет обязательные
секреты и image digest, поднимает PostgreSQL, пересоздаёт development-базу,
выполняет `db:init` и seed, затем ждёт health backend, front-office и
back-office.

Перед development-поставкой синхронизируйте `BOOTSTRAP_ADMIN_PHONE` и
`AUTH_DEVELOPMENT_OTP` из игнорируемого локального
`deploy/development-access.env` в GitHub Environment `development` по
[инструкции доступа](Environments.md#доступ-администратора-development).
Изменение файла без этой синхронизации и следующей development-поставки не
меняет учётные данные работающего стенда.

Пересоздание разрешено только compose-проекту `expressa-development` и его
сервису PostgreSQL. Это намеренно удаляет данные development. Миграций,
backfill, restore и отдельного E2E-стенда нет. Пользовательские потоки
принимаются вручную в работающем интерфейсе.
