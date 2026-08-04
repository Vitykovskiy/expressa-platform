---
title: API аутентификации
sources: [Expressa_MVP_Техническое_задание.md]
---

# API аутентификации

Аутентификация создаёт серверную сессию по одноразовому коду и выдаёт короткоживущий access token. Подробный контракт, схемы и security-схемы — [OpenAPI](../../backend/openapi/openapi.json); эта нота оставляет компактную карту поведения клиентов.

| Метод и путь | Успех | Вход | Ответ |
|---|---:|---|---|
| `POST /api/v1/auth/otp/request` | `202` | `{ phone }` | `{ expiresInSeconds: 300, retryAfterSeconds: 60 }` |
| `POST /api/v1/auth/otp/verify` | `200` | `{ phone, code: «6 цифр» }` | `AccessTokenDto` и refresh-cookie |
| `POST /api/v1/auth/refresh` | `200` | refresh-cookie | `AccessTokenDto` и ротированный refresh-cookie |
| `POST /api/v1/auth/logout` | `204` | refresh-cookie | refresh-cookie очищена; активная совпавшая сессия отозвана |
| `GET /api/v1/me` | `200` | `Authorization: Bearer <accessToken>` | `CurrentUserDto` |

Состав `AccessTokenDto` и `CurrentUserDto`, включая роли `customer`, `barista` и `administrator`, определяет OpenAPI.

## Сессия и границы безопасности

- Refresh token хранится только в cookie `expressa_refresh`: `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`; `Secure=false` только при `NODE_ENV=local`, иначе `Secure=true`.
- Refresh и logout требуют существующий точный `Origin` из `CORS_ORIGINS`; CORS допускает только этот список origin и запросы с credentials.
- Access token не является cookie: клиент передаёт его только в Bearer-заголовке. Защищённый запрос дополнительно сверяет активность серверной сессии и актуальную роль пользователя.
- Ошибки имеют единый вид `{ code, message, details, requestId }`. Для OTP используются `400 VALIDATION_ERROR`, `401 AUTH_CODE_INVALID` или `AUTH_CODE_EXPIRED`, `429 AUTH_RATE_LIMITED` с `Retry-After: 60`, `503 SERVICE_UNAVAILABLE`; отсутствующая или невалидная сессия даёт `401`, запрещённая роль/origin — `403 ACCESS_DENIED`.
