# Backend Expressa

Backend — HTTP API Expressa. Он обслуживает меню, заказы, доступ сотрудников и
пользовательские сессии; данные хранятся в PostgreSQL. Устройство сервера и
действующие контракты собраны в [документации backend](docs/INDEX.md).

## Структура каталога

```text
backend/
├── docs/               # документация, правила и карта текущего устройства
├── migrations/         # последовательные SQL-миграции PostgreSQL
├── scripts/            # миграции, заполнение данных и служебные команды
├── src/                # NestJS-модули и исполняемый код API
├── test/               # интеграционные и HTTP e2e-проверки
├── .env.example        # безопасный шаблон переменных окружения
├── compose.local.yml   # локальный PostgreSQL
├── package.json        # команды разработки и зависимости
└── AGENTS.md           # правила изменения backend
```

## Локальный запуск

```bash
npm ci
docker compose -f compose.local.yml up -d
cp .env.example .env
set -a; source .env; set +a
npm run migrate
npm run seed
npm run start:dev
```

После копирования шаблона заполните обязательные значения окружения. Их
проверяет [конфигурация](src/platform/config/environment.ts): всегда нужны
`NODE_ENV`, `PORT`, `DATABASE_URL`, секреты сессии, VAPID-ключи и `CORS_ORIGINS`;
для `local` и `development` также нужен `AUTH_DEVELOPMENT_OTP`.

Проверка доступности: `GET http://localhost:3000/health/live`. API использует
префикс `/api/v1`; при `NODE_ENV=local` или `development` Swagger доступен по
`/docs`.

## Команды

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
npm run openapi:check
npm run migrate
npm run seed
npm run staff -- upsert --phone +79991234567 --role administrator
```

`npm run staff` создаёт или обновляет сотрудника. Допустимые роли: `barista`,
`administrator`; телефон — `+7XXXXXXXXXX`.

## Где искать детали

- [AGENTS.md](AGENTS.md) — правила backend и обязательные проверки.
- [docs/INDEX.md](docs/INDEX.md) — карта архитектуры, предметных областей,
  данных, API, операций и тестирования.
- [openapi/openapi.json](openapi/openapi.json) — машиночитаемый HTTP-контракт;
  `npm run openapi:check` сопоставляет его с NestJS-декораторами.
- [тестирование](docs/95-testing/INDEX.md) — уровни и сценарии проверок.
