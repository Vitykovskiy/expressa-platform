# Expressa — E2E

Standalone UI-only набор Playwright для сквозных браузерных проверок Expressa. Он проверяет отдельно запущенные front-office и back-office и не заменяет их локальные E2E-наборы. Архитектурная граница описана в [ADR-001](docs/20-architecture/ADR/ADR-001-standalone-e2e-architecture.md).

## Запуск

```bash
npm ci
cp .env.example .env.e2e.local
# Указать URL и учётные данные administrator, staff и customer
npm run e2e
```

Оба приложения запускаются вне этого каталога. `E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL` обязательны: это абсолютные HTTP(S)-адреса без credentials, query и fragment.
Сквозные сценарии дополнительно используют `E2E_ADMIN_PHONE`, `E2E_ADMIN_OTP`,
`E2E_STAFF_PHONE`, `E2E_STAFF_OTP`, `E2E_CUSTOMER_PHONE` и
`E2E_CUSTOMER_OTP`. Для VPS administrator и OTP остаются секретами, а
синтетические staff и customer из пула `+79990000002…+79990000004` — часть
зафиксированного E2E-контракта.

## Команды

```bash
npm run e2e:headed
npm run e2e:boundaries
npm run typecheck:e2e
npm run lint
npm run format:check
```

Документация и правила: [карта vault](docs/INDEX.md), [карта сценариев](docs/95-testing/E2E-map.md), [AGENTS.md](AGENTS.md).

## Автоматический запуск

После каждого push в `main` workflow поставки собирает неизменяемый E2E-образ
и запускает пять сценариев `JOURNEY-01`—`JOURNEY-05` дважды в изолированном
временном Compose-проекте на VPS. Последний HTML-отчёт доступен на
`http://<IP_VPS>:8088/` только для CIDR из GitHub Environment Secret
`E2E_REPORT_ALLOWLIST`; administrator и OTP берутся из существующих
`BOOTSTRAP_ADMIN_PHONE` и `AUTH_DEVELOPMENT_OTP`, а staff и customer — из
резервного пула с исключением administrator. Все три роли должны различаться. Порядок запуска,
секреты и очистка описаны в
[E2E-on-VPS](../docs/70-deployment/E2E-on-VPS.md).
