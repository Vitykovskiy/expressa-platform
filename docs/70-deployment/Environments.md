---
title: Среды поставки
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../deploy/compose.yml
  - ../../.github/workflows/development-delivery.yml
  - ../../.github/workflows/staging-deploy.yml
---

# Среды поставки

`development` поставляется после main, `staging` — по тегу `staging-v*`; обе
используют отдельные Compose project, сети и volume PostgreSQL на одном VPS.
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

Production-среда не реализована и не является поддерживаемым путём поставки.
[ADR-002](../20-architecture/ADR/ADR-002-delivery-topology.md).
