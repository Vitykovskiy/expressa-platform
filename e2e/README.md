# Expressa — E2E

Standalone UI-only набор Playwright для сквозных браузерных проверок Expressa. Он проверяет отдельно запущенные front-office и back-office и не заменяет их локальные E2E-наборы. Архитектурная граница описана в [ADR-001](docs/20-architecture/ADR/ADR-001-standalone-e2e-architecture.md).

## Запуск

```bash
npm ci
cp .env.example .env.e2e.local
# Указать E2E_FRONT_OFFICE_URL и E2E_BACK_OFFICE_URL
npm run e2e
```

Оба приложения запускаются вне этого каталога. `E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL` обязательны: это абсолютные HTTP(S)-адреса без credentials, query и fragment.

## Команды

```bash
npm run e2e:headed
npm run e2e:boundaries
npm run typecheck:e2e
npm run lint
npm run format:check
```

Документация и правила: [карта vault](docs/INDEX.md), [карта сценариев](docs/95-testing/E2E-map.md), [AGENTS.md](AGENTS.md).
