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

`ApiClient` формирует запросы относительно заданной базы, передаёт JSON и заголовки, проверяет ожидаемый статус и форму ответа во время выполнения. Сетевой сбой, ошибка API и несовпадение формы становятся `ApiError`; `CatalogApi` преобразует их в `CatalogApiError` с безопасными ошибками полей. Экран передаёт пользователю сообщение и request ID, но не детали HTTP. Источники: [client.ts](../../src/shared/api/client.ts), [catalog.api.ts](../../src/shared/api/catalog.api.ts), [session.store.ts](../../src/app/session.store.ts).

Вход вызывает `POST /api/v2/auth/otp/request`, `POST /api/v2/auth/otp/verify`, `POST /api/v2/auth/refresh`, `POST /api/v2/auth/logout` и `GET /api/v2/me`; access token хранится только в session store и передаётся как Bearer на `GET /api/v2/backoffice/catalog` и операции каталога. Клиент проверяет телефон `+7` и десять цифр, роли и положительные метаданные токена. Источники: [auth.api.ts](../../src/shared/api/auth.api.ts), [session.store.ts](../../src/app/session.store.ts), [OpenAPI](../../contracts/openapi.json).

Контракт UI, store и операций каталога — в [Catalog-management](Catalog-management.md). Эта нота остаётся источником транспортной границы: [CatalogApi](../../src/shared/api/catalog.api.ts) и [catalog API tests](../../src/shared/api/catalog.api.spec.ts).

Снимок [OpenAPI](../../contracts/openapi.json) — контрактный источник всех `/api/v2/backoffice/catalog*` путей и auth-путей; `npm run contract:check` посимвольно сравнивает его с `backend/openapi/openapi.json`. Public menu, orders и health есть в снимке, но runtime back-office их не вызывает. При изменении контракта обновляются runtime-проверки и тесты API, затем запускается эта сверка.

## Целевая v3-граница цен

Текущий клиент и OpenAPI-снимок остаются на `/api/v2` и `S/M/L`. Принятый в
[ADR-006](../../../docs/20-architecture/ADR/ADR-006-product-variant-portions.md)
`/api/v3` контракт ещё не реализован.

Будущий `CatalogApi` проверяет одну из двух форм: `price` с nullable
`portionLabel` и без choices либо минимум два упорядоченных price choices со
стабильными `id`, обязательными plain-text labels, ценой и ручной доступностью.
Он не принимает kind, amount, unit, preset identity, inventory fields или
default. Ошибки цены, обязательной/дублирующейся подписи и несовместимых форм
остаются структурированными field/domain errors у конкретной строки.

Availability читает и меняет доступность конкретного choice по id, а staff
order reads получают nullable id и неизменяемый snapshot label. UI-пресеты не
входят в OpenAPI и не отличаются от собственного текста на transport-границе.
Правила совместимости и отключения v2 фиксируются отдельно до cutover;
предыдущая матрица `410` и 30-дневное окно не являются частью принятой модели.
Runtime validators, OpenAPI contracts и проверки ещё не приведены к target v3.
