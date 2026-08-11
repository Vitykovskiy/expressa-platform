---
title: Запуск, безопасность и наблюдаемость
type: operations
owner: backend
last_verified: 2026-08-11
sources:
  - ../../src/main.ts
  - ../../src/platform/config/environment.ts
  - ../../Dockerfile
---

# Запуск, безопасность и наблюдаемость

Локальная PostgreSQL запускается `docker compose -f compose.local.yml up -d`,
затем применяются `npm run migrate`, `npm run seed` и `npm run start:dev`.
[Compose](../../compose.local.yml), [scripts](../../package.json).

Перед стартом проверяются `NODE_ENV`, `PORT`, `DATABASE_URL`, access-token
secret, OTP pepper и точные `CORS_ORIGINS`. Development OTP обязателен только
в local/development; SMS.ru credentials — в staging/production. Значения и
проверки определяет [environment](../../src/platform/config/environment.ts),
безопасный пример — [.env.example](../../.env.example).

HTTP middleware даёт requestId, структурный JSON-лог без query string и
метрики запросов/ошибок/readiness. Глобальный filter выдаёт безопасную ошибку;
readiness проверяет PostgreSQL. [Middleware](../../src/platform/observability/request-observability.middleware.ts),
[logger](../../src/platform/observability/observability-logger.service.ts),
[health](../../src/platform/health/health.controller.ts).

Образ собирает TypeScript, запускается непривилегированным пользователем и
проверяет `/health/live`; SIGTERM закрывает приложение и прекращает новые
запросы. Бэкап/восстановление не автоматизированы в runtime и остаются
обязанностью PostgreSQL-оператора. [Dockerfile](../../Dockerfile),
[shutdown](../../src/main.ts), [production e2e](../../test/e2e/production.e2e-spec.ts).
