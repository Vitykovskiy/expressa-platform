# Expressa — E2E

Standalone-набор Playwright проверяет полный путь заказа через браузерные
интерфейсы front-office и back-office. Оба приложения запускаются отдельно;
набор взаимодействует с ними только через UI. Граница и устройство набора
зафиксированы в [ADR-001](docs/20-architecture/ADR/ADR-001-standalone-e2e-architecture.md).

## Структура каталога

```text
e2e/
├── components/       # общие фрагменты пользовательских интерфейсов
├── docs/             # правила набора, архитектура и карта сценариев
├── fixtures/         # общая точка сборки тестовых зависимостей
├── pages/            # Page и Component Objects экранов двух приложений
├── specs/            # браузерные пользовательские сценарии
├── support/          # проверка окружения и предметные тестовые данные
├── AGENTS.md         # правила внесения изменений в E2E-набор
├── package.json      # команды запуска и статических проверок
└── playwright.config.ts # конфигурация Playwright
```

## Запуск

```bash
npm ci
cp .env.example .env.e2e.local
# Указать URL и учётные данные administrator, staff и customer
npm run e2e
```

`E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL` обязательны. Они принимают
абсолютные HTTP(S)-адреса без учётных данных, query-параметров и fragment.
Сквозные сценарии также используют телефоны и OTP для ролей administrator,
staff и customer; значения остаются в локальном файле окружения.

## Проверки и документация

```bash
npm run e2e:headed
npm run typecheck:e2e
npm run lint
npm run format:check
```

- [Правила работы](AGENTS.md) — UI-only границы и обязательные проверки.
- [Карта документации](docs/INDEX.md) — быстрый старт, соглашения и сценарии.
- [Карта E2E-сценариев](docs/95-testing/E2E-map.md) — состав пользовательских
  проверок.

## Результаты поставки

После push в `main` [Development delivery](https://github.com/Vitykovskiy/expressa-platform/actions/workflows/development-delivery.yml):

1. поставляет приложения;
2. собирает E2E-образ;
3. запускает Playwright на временном VPS-стенде.

Если поставка или сборка E2E-образа неуспешна, workflow публикует
диагностическую страницу без браузерных сценариев.

Адрес Playwright report не хранится в репозитории: host берётся из приватного
GitHub Environment Secret `EXPRESSA_VPS_HOST`, доступ ограничивает
`E2E_REPORT_ALLOWLIST`. Повтор того же commit запускается через `Re-run jobs` в
GitHub Actions.

Порядок поставки, доступ и очистка стенда — в
[E2E на VPS](../docs/70-deployment/E2E-on-VPS.md).
