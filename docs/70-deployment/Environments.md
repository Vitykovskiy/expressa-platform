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

Локальная карта адресов стендов хранится в игнорируемом файле
[`deploy/stand-urls.env`](../../deploy/stand-urls.env). Имена переменных:
`DEVELOPMENT_FRONT_URL`, `DEVELOPMENT_BACK_URL`,
`STAGING_FRONT_URL`, `STAGING_BACK_URL`, `EXPRESSA_DEVELOPMENT_API_URL`,
`EXPRESSA_STAGING_API_URL`.

| Среда | Front-office | Back-office | API |
| --- | --- | --- | --- |
| development | `DEVELOPMENT_FRONT_URL` | `DEVELOPMENT_BACK_URL` | `EXPRESSA_DEVELOPMENT_API_URL` |
| staging | `STAGING_FRONT_URL` | `STAGING_BACK_URL` | `EXPRESSA_STAGING_API_URL` |

Для API проверка доступности выполняется по значению соответствующей переменной
с суффиксами `/health/live` и `/health/ready`.
Swagger и OpenAPI публикуются только в `development` по `/docs` и
`/docs/openapi.json`.
В `staging` документация API отключена конфигурацией приложения.

Адреса выше — операционная карта DNS и проверяются запросом к живым endpoint;
источник поставки — workflows и Compose, а не локальные настройки разработчика.

Production использует `/srv/expressa/production`, `expressa-production-*` сети и volume PostgreSQL; его `runtime.env` существует только на VPS. В репозитории нет production-переменных адресов: допустимые браузерные origin задаёт `CORS_ORIGINS` в этом VPS-файле, а внешний API URL проверяется оператором по DNS после promotion. `environment: production` в workflow служит только меткой аудита и поставки. Ручное продвижение переносит точный manifest принятого staging-тега без пересборки. [Production workflow](../../.github/workflows/production-promotion.yml), [Compose](../../deploy/compose.yml).
