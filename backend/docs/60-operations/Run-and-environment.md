---
title: Запуск, безопасность и наблюдаемость
type: operations
owner: backend
last_verified: 2026-09-14
sources:
  - ../../src/main.ts
  - ../../src/platform/config/environment.ts
  - ../../Dockerfile
  - ../../scripts/initialize-database.ts
---

# Запуск, безопасность и наблюдаемость

Для local запускают PostgreSQL командой `docker compose -f compose.local.yml up -d`,
затем `npm run db:init`, `npm run seed` и `npm run start:dev`.
[Compose](../../compose.local.yml), [команды](../../package.json).

`db:init` допустим только для пустой базы. Local, test и development не хранят
данные между поддерживаемыми развёртываниями: база пересоздаётся из
`schema.sql`, после чего запускается seed. Миграций, backfill, backup/restore
и поставки staging/production в поддерживаемом пути нет.

Перед стартом проверяются `NODE_ENV`, `PORT`, `DATABASE_URL`, access-token
secret, OTP pepper, VAPID subject/public/private keys и точные `CORS_ORIGINS`.
Development OTP обязателен только в local/development. Значения и проверки
определяет [environment](../../src/platform/config/environment.ts), безопасный
пример — [.env.example](../../.env.example).

HTTP middleware даёт requestId, структурный JSON-лог без query string и
метрики запросов/ошибок/readiness. Глобальный filter выдаёт безопасную ошибку;
readiness проверяет PostgreSQL. [Middleware](../../src/platform/observability/request-observability.middleware.ts),
[logger](../../src/platform/observability/observability-logger.service.ts),
[health](../../src/platform/health/health.controller.ts).

Backend доверяет forwarded адресу OTP только от private edge reverse-proxy peer;
прямой public peer использует собственный socket address, даже если прислал
`X-Forwarded-For`. Для proxy применяется ровно один hop.

Образ собирает TypeScript, запускается непривилегированным пользователем и
проверяет `/health/live`; SIGTERM закрывает приложение и прекращает новые
запросы. [Dockerfile](../../Dockerfile), [shutdown](../../src/main.ts).
