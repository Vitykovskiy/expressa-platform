---
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/auth/transport/auth.controller.ts
---

# API аутентификации

Контракт: `POST /api/v2/auth/otp/request` возвращает metadata;
`POST /api/v2/auth/otp/verify` и `POST /api/v2/auth/refresh` возвращают Bearer
access token; `POST /api/v2/auth/logout` возвращает 204; `GET /api/v2/me`
требует Bearer. OpenAPI описывает paths и JSON body, но не response
headers/cookie attributes. [Источник: OpenAPI](../../backend/openapi/openapi.json).

Refresh cookie выдаёт transport controller через `auth-cookie`, ротируется при
refresh и очищается при logout. [Источники: controller](../../backend/src/auth/transport/auth.controller.ts), [cookie](../../backend/src/auth/transport/auth-cookie.ts).

Refresh/logout защищены OriginGuard; `/me` и защищённые бизнес-методы проверяет
session guard. Front- и back-office используют одинаковые endpoint-пути, но
локально владеют экранным состоянием. [Источники: controller](../../backend/src/auth/transport/auth.controller.ts), [front consumer](../../front-office/src/shared/api/auth.api.ts), [back consumer](../../back-office/src/shared/api/auth.api.ts).
