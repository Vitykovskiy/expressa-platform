# Backend Expressa

Backend — HTTP API Expressa. Он обслуживает меню, заказы, доступ сотрудников и
пользовательские сессии; данные хранятся в PostgreSQL. Устройство сервера и
действующие контракты собраны в [документации backend](docs/INDEX.md).

## Структура каталога

```text
backend/
├── docs/               # документация, правила и карта текущего устройства
├── schema.sql          # единственная декларативная актуальная схема PostgreSQL
├── scripts/            # инициализация пустой БД, seed и служебные команды
├── src/                # NestJS-модули и исполняемый код API
├── test/               # модульные и интеграционные проверки
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
npm run db:init
npm run seed
npm run start:dev
```

После копирования шаблона заполните обязательные значения окружения. Их
проверяет [конфигурация](src/platform/config/environment.ts).

Всегда нужны:

- `NODE_ENV`;
- `PORT`;
- `DATABASE_URL`;
- секреты сессии;
- VAPID-ключи;
- `CORS_ORIGINS`.

Для `local` и `development` также нужен `AUTH_DEVELOPMENT_OTP`.

Проверка доступности: `GET http://localhost:3000/health/live`.

API использует префикс `/api/v2`. Денежные значения передаются целыми рублями:
`320 ₽` — это `320`. При `NODE_ENV=local` или `development`
Swagger доступен по `/docs`.

## Команды

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
npm run openapi:check
npm run db:init
npm run seed
npm run staff -- upsert --phone +79991234567 --role administrator
```

`npm run staff` создаёт или обновляет сотрудника.

`npm run db:init` применяется только к пустой одноразовой базе и завершается
ошибкой для базы с прикладными таблицами. Он не обновляет и не сохраняет данные.
Поддерживаемые базы local/test/development пересоздаются из `schema.sql`, затем
заполняются `npm run seed`; миграций, backfill и сохранения данных нет.

Допустимые роли: `barista`, `administrator`, `customer` (последняя безопасно
понижает сотрудника). Формат телефона —
`+7XXXXXXXXXX`.

## Где искать детали

- [AGENTS.md](AGENTS.md) — правила backend и обязательные проверки.
- [docs/INDEX.md](docs/INDEX.md) — карта архитектуры, предметных областей,
  данных, API, операций и тестирования.
- [openapi/openapi.json](openapi/openapi.json) — машиночитаемый HTTP-контракт;
  `npm run openapi:check` сопоставляет его с NestJS-декораторами.
- [тестирование](docs/95-testing/INDEX.md) — уровни и сценарии проверок.
