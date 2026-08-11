---
type: guide
implementation_status: current
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../src/shared/api/client.ts
  - ../../src/shared/api/auth.api.ts
  - ../../src/shared/api/catalog.api.ts
---

# API-интеграция и граница ошибок back-office

`ApiClient` формирует запросы относительно заданной базы, передаёт JSON и заголовки, проверяет ожидаемый статус и форму ответа во время выполнения. Сетевой сбой, ошибка API и несовпадение формы становятся `ApiError`; `CatalogApi` преобразует их в `CatalogApiError` с безопасными ошибками полей. Экран передаёт пользователю сообщение и request ID, но не детали HTTP. Источники: [client.ts](../../src/shared/api/client.ts), [catalog.api.ts](../../src/shared/api/catalog.api.ts), [api-error.mapper.ts](../../src/app/api-error.mapper.ts).

Вход вызывает `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` и `GET /api/v1/me`; access token хранится только в session store и передаётся как Bearer на `GET /api/v1/backoffice/catalog` и операции каталога. Клиент проверяет телефон `+7` и десять цифр, роли и положительные метаданные токена. Источники: [auth.api.ts](../../src/shared/api/auth.api.ts), [session.store.ts](../../src/app/session.store.ts), [OpenAPI](../../contracts/openapi.json).

Контракт UI, store и операций каталога — в [Catalog-management](Catalog-management.md). Эта нота остаётся источником транспортной границы: [CatalogApi](../../src/shared/api/catalog.api.ts) и [catalog API tests](../../src/shared/api/catalog.api.spec.ts).

Снимок [OpenAPI](../../contracts/openapi.json) — контрактный источник всех `/api/v1/backoffice/catalog*` путей и auth-путей; `npm run contract:check` посимвольно сравнивает его с `backend/openapi/openapi.json`. Public menu, orders и health есть в снимке, но runtime back-office их не вызывает. При изменении контракта обновляются runtime-проверки и тесты API, затем запускается эта сверка.
