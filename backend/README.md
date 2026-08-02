# Backend Expressa

Автономный backend Expressa на NestJS и TypeScript. Текущий корневой модуль
подготавливает приложение к подключению предметных модулей; HTTP API пока не
опубликован.

## Требования

- Node.js `24.13.0` — версия закреплена в `.nvmrc`;
- PostgreSQL — единственное планируемое хранилище предметных данных;
- npm с lock-файлом `package-lock.json`.

## Команды

```bash
npm ci
npm run start:dev
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

Перед запуском backend проверяет обязательные `NODE_ENV`, `PORT` и `DATABASE_URL`.
Допустимые delivery-значения `NODE_ENV`: `local`, `development`, `staging`, `production`.
Пример локального окружения: [.env.example](.env.example).

## Bootstrap сотрудников

`BOOTSTRAP_ADMIN_PHONE` принимает только номер формата `+7XXXXXXXXXX`.
`npm run seed` идемпотентно создаёт или обновляет для него роль `administrator`.

```bash
npm run staff -- upsert --phone +79991234567 --role barista
npm run staff -- upsert --phone +79991234567 --role administrator
```

Команда создаёт или обновляет сотрудника. Неверный, неизвестный либо
дублированный аргумент завершается с кодом `2`.

## Документация

Серверные ноты: [docs/README.md](docs/README.md). Навигация: [docs/INDEX.md](docs/INDEX.md).
