---
title: Среды поставки
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../deploy/compose.yml
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/staging-deploy.yml
  - ../../.github/workflows/production-promotion.yml
---

# Среды поставки

`development` поставляется после main, `staging` — по тегу `staging-v*`, production — вручную из принятого `staging-v*`; все среды используют отдельные Compose project, сети и volume PostgreSQL на одном VPS.
[Development workflow](../../.github/workflows/development-delivery.yml),
[staging workflow](../../.github/workflows/staging-deploy.yml), [Compose](../../deploy/compose.yml).

## Адреса стендов

| Среда | Customer | Admin | API |
| --- | --- | --- | --- |
| development | <https://dev.expressa.vitykovskiy.ru/> | <https://admin.dev.expressa.vitykovskiy.ru/> | <https://api.dev.expressa.vitykovskiy.ru> |
| staging | <https://staging.expressa.vitykovskiy.ru/> | <https://admin.staging.expressa.vitykovskiy.ru/> | <https://api.staging.expressa.vitykovskiy.ru> |

Для обоих API проверка доступности выполняется по `/health/live` и
`/health/ready`. Swagger и OpenAPI публикуются только в `development`:
<https://api.dev.expressa.vitykovskiy.ru/docs> и
<https://api.dev.expressa.vitykovskiy.ru/docs/openapi.json>.
В `staging` документация API отключена конфигурацией приложения.

Адреса выше — операционная карта DNS и проверяются запросом к живым endpoint;
источник поставки — workflows и Compose, а не локальные настройки разработчика.

Production использует `/srv/expressa/production`, `expressa-production-*` сети и volume PostgreSQL; его `runtime.env` существует только на VPS. В репозитории нет production-переменных адресов: допустимые браузерные origin задаёт `CORS_ORIGINS` в этом VPS-файле, а внешний API URL проверяется оператором по DNS после promotion. `environment: production` в workflow служит только меткой аудита и поставки. Ручное продвижение переносит точный manifest принятого staging-тега без пересборки. [Production workflow](../../.github/workflows/production-promotion.yml), [Compose](../../deploy/compose.yml).
