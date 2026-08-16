# Backend Expressa

HTTP-сервер Expressa на NestJS, TypeScript и PostgreSQL. Публичный клиент читает
меню и создаёт заказ, сотрудник управляет каталогом, а пользователь получает
сессию по одноразовому коду. Рабочие сценарии и их первичные источники собраны
в [документации](docs/INDEX.md).

## Быстрый старт

```bash
npm ci
docker compose -f compose.local.yml up -d
cp .env.example .env
set -a; source .env; set +a
npm run migrate
npm run seed
npm run start:dev
```

Проверка доступности: `GET http://localhost:3000/health/live`. HTTP API имеет
префикс `/api/v1`; при `NODE_ENV=local` документация доступна по `/docs`.

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

Перед запуском обязательны `NODE_ENV`, `PORT`, `DATABASE_URL`,
`AUTH_ACCESS_TOKEN_SECRET`, `AUTH_OTP_PEPPER`, VAPID subject/public/private keys
и `CORS_ORIGINS`. В `local` и `development` также нужен `AUTH_DEVELOPMENT_OTP`;
в `staging` и `production` — `SMS_RU_API_ID` и `SMS_RU_SENDER`. Пример без
секретов: [.env.example](.env.example).

## Документация и правила

[docs/INDEX.md](docs/INDEX.md) — карта текущего устройства и реестр покрытия;
[AGENTS.md](AGENTS.md) — локальные правила. Машиночитаемый HTTP-контракт —
[openapi/openapi.json](openapi/openapi.json).
