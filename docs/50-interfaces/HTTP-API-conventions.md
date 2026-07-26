---
title: Соглашения HTTP API
sources: [Expressa_MVP_Техническое_задание.md]
---

# Соглашения HTTP API

- **TR-API-001.** Backend публикует версионированный HTTP API `/api/v1` и актуальный OpenAPI-контракт.

## Общие правила

- базовый путь: `/api/v1`;
- формат: JSON UTF-8;
- идентификаторы: UUID;
- даты: ISO 8601 UTC;
- авторизация: Bearer access token;
- обновление сессии: HttpOnly refresh cookie;
- ошибки: единый объект `{ code, message, details, requestId }`;
- создание заказа использует заголовок `Idempotency-Key`;
- контракт: OpenAPI, формируемый backend в CI;
- совместимость: добавочные изменения внутри `/v1`, новый базовый путь для разрыва контракта.

## Swagger и OpenAPI

- Swagger UI доступен по адресу `/docs`;
- OpenAPI JSON доступен по адресу `/docs/openapi.json`;
- в средах `local` и `development` доступны Swagger UI и OpenAPI JSON;
- в `local` и `development` дополнительная авторизация для доступа к документации не требуется;
- в `staging` и `production` Swagger UI и OpenAPI JSON отключены;
- публичные запросы можно выполнять через Swagger UI без токена;
- для защищённых запросов пользователь Swagger UI указывает Bearer access token с необходимой ролью;
- Swagger UI и OpenAPI JSON всегда описывают одну и ту же актуальную версию API.

## Проверки

| Метод и путь | Роль | Назначение |
|---|---|---|
| `GET /health/live` | Infrastructure | Проверка процесса |
| `GET /health/ready` | Infrastructure | Проверка зависимостей |
