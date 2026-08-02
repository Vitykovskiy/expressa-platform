# E01 — Фундаменты репозиториев и поставки

Статус: complete.

Статус сверяется с текущим кодом, локальными проверками и GitHub Actions. `complete` означает, что критерии этой карточки доказаны; `in progress` и `blocked` не являются закрытием задачи.

| Карточка | Статус | Доказательство или незакрытая граница |
| --- | --- | --- |
| [[backend/BL-0001\|BL-0001]] | complete | Автономный NestJS-проект, lock-файл, документация; Backend CI 30727498998 успешен. |
| [[backend/BL-0002\|BL-0002]] | complete | Валидация окружения и `.env.example` трёх приложений проверены в тестах и CI. |
| [[backend/BL-0003\|BL-0003]] | complete | Чистая PostgreSQL-база, миграции и idempotent seed подтверждены backend CI; live проверен persistent DB aggregate. |
| [[backend/BL-0004\|BL-0004]] | complete | `/api/v1`, OpenAPI и Swagger-конфигурация покрыты backend-тестами. |
| [[backend/BL-0005\|BL-0005]] | complete | Health, requestId, журналы и graceful shutdown подтверждены backend CI и live health. |
| [[backend/BL-0006\|BL-0006]] | complete | Idempotent bootstrap administrator и staff CLI подтверждены CI и DB aggregate. |
| [[front-office/BL-0007\|BL-0007]] | complete | Автономная PWA-оболочка, сборка и Docker image подтверждены CI. |
| [[front-office/BL-0008\|BL-0008]] | complete | Локальные маршруты, состояние, API-клиент, error UI и OpenAPI snapshot проверены. |
| [[back-office/BL-0009\|BL-0009]] | complete | Автономная PWA-оболочка, сборка и Docker image подтверждены CI. |
| [[back-office/BL-0010\|BL-0010]] | complete | Локальные маршруты, store, API-клиент, OpenAPI snapshot и error UI подтверждены CI. |
| [[delivery/BL-0011\|BL-0011]] | complete | Backend Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0012\|BL-0012]] | complete | Front-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0013\|BL-0013]] | complete | Back-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0014\|BL-0014]] | complete | Local/development/staging/production определены; development и staging развернуты, production отсутствует по плану. |
| [[delivery/BL-0015\|BL-0015]] | complete | KISS delivery: development run 30750587887 и staging run 30750840290 успешны для commit `5b3d2bb45841a276d998e4b6bb5e51aed9af462c`. |
| [[delivery/BL-0016\|BL-0016]] | complete | Front-office CI/Docker green; отдельная read-only live same-origin проверка пройдена в обеих средах. |
| [[delivery/BL-0017\|BL-0017]] | complete | Back-office CI/Docker green; отдельная read-only live same-origin проверка пройдена в обеих средах. |
| [[delivery/BL-0018\|BL-0018]] | complete | Development traceable по head SHA run и трём immutable image digest; health проверен отдельно. |
| [[delivery/BL-0019\|BL-0019]] | complete | Тег `staging-v0.1.2` развернул три immutable digest без rebuild/latest; production исключён. |

## Карточки

### backend

- [[backend/BL-0001]]
- [[backend/BL-0002]]
- [[backend/BL-0003]]
- [[backend/BL-0004]]
- [[backend/BL-0005]]
- [[backend/BL-0006]]

### front-office

- [[front-office/BL-0007]]
- [[front-office/BL-0008]]

### back-office

- [[back-office/BL-0009]]
- [[back-office/BL-0010]]

### delivery

- [[delivery/BL-0011]]
- [[delivery/BL-0012]]
- [[delivery/BL-0013]]
- [[delivery/BL-0014]]
- [[delivery/BL-0015]]
- [[delivery/BL-0016]]
- [[delivery/BL-0017]]
- [[delivery/BL-0018]]
- [[delivery/BL-0019]]

Архитектура поставки: [[../../../20-architecture/ADR/ADR-002-delivery-topology]]. Текущее доказательство CI: [[../../../70-deployment/CI-CD]].
