---
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/auth/transport/auth.controller.ts
---

# API аутентификации

Контракт: `POST /api/v2/auth/otp/request` возвращает `202` metadata;
`POST /api/v2/auth/otp/verify` и `POST /api/v2/auth/refresh` возвращают `200`
Bearer access token; `POST /api/v2/auth/logout` возвращает `204`; `GET /api/v2/me`
требует Bearer. Некорректный input — `400 VALIDATION_ERROR`, неверный или
устаревший OTP — соответственно `401 AUTH_CODE_INVALID` и
`401 AUTH_CODE_EXPIRED`, cooldown — `429 AUTH_RATE_LIMITED`, недоступность
delivery/session — `503 SERVICE_UNAVAILABLE`. Ошибки имеют форму
`{ code, message, details, requestId }`; `429` содержит целочисленный
`Retry-After` в секундах с фактическим остатком cooldown.

Verify и refresh выдают `Set-Cookie` для host-only `expressa_refresh` с
`HttpOnly`, `SameSite=Strict`, path `/api/v2/auth` и `Secure` вне local;
logout очищает эту cookie. Refresh cookie ротируется при refresh. [Источники: controller](../../backend/src/auth/transport/auth.controller.ts), [cookie](../../backend/src/auth/transport/auth-cookie.ts).

Refresh/logout защищены OriginGuard; `/me` и защищённые бизнес-методы проверяет
session guard. Front- и back-office используют одинаковые endpoint-пути, но
локально владеют экранным состоянием. [Источники: controller](../../backend/src/auth/transport/auth.controller.ts), [front consumer](../../front-office/src/shared/api/auth.api.ts), [back consumer](../../back-office/src/shared/api/auth.api.ts).
