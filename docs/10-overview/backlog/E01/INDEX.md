# E01 — Фундаменты репозиториев и поставки

[К backlog](../INDEX.md).

Статус: complete.

Статус сверяется с текущим кодом, локальными проверками и GitHub Actions. `complete` означает, что критерии этой карточки доказаны; `in progress` и `blocked` не являются закрытием задачи.

| Карточка | Статус | Доказательство или незакрытая граница |
| --- | --- | --- |
| [BL-0001](backend/BL-0001.md) | complete | Автономный NestJS-проект, lock-файл, документация; Backend CI 30727498998 успешен. |
| [BL-0002](backend/BL-0002.md) | complete | Валидация окружения и `.env.example` трёх приложений проверены в тестах и CI. |
| [BL-0003](backend/BL-0003.md) | complete | Чистая PostgreSQL-база, миграции и idempotent seed подтверждены backend CI; live проверен persistent DB aggregate. |
| [BL-0004](backend/BL-0004.md) | complete | `/api/v1`, OpenAPI и Swagger-конфигурация покрыты backend-тестами. |
| [BL-0005](backend/BL-0005.md) | complete | Health, requestId, журналы и graceful shutdown подтверждены backend CI и live health. |
| [BL-0006](backend/BL-0006.md) | complete | Idempotent bootstrap administrator и staff CLI подтверждены CI и DB aggregate. |
| [BL-0007](front-office/BL-0007.md) | complete | Автономная PWA-оболочка, сборка и Docker image подтверждены CI. |
| [BL-0008](front-office/BL-0008.md) | complete | Локальные маршруты, состояние, API-клиент, error UI и OpenAPI snapshot проверены. |
| [BL-0009](back-office/BL-0009.md) | complete | Автономная PWA-оболочка, сборка и Docker image подтверждены CI. |
| [BL-0010](back-office/BL-0010.md) | complete | Локальные маршруты, store, API-клиент, OpenAPI snapshot и error UI подтверждены CI. |
| [BL-0011](delivery/BL-0011.md) | complete | Backend Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [BL-0012](delivery/BL-0012.md) | complete | Front-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [BL-0013](delivery/BL-0013.md) | complete | Back-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [BL-0014](delivery/BL-0014.md) | complete | Local/development/staging/production определены; development и staging развернуты, production отсутствует по плану. |
| [BL-0015](delivery/BL-0015.md) | complete | KISS delivery: development run 30750587887 и staging run 30750840290 успешны для commit `5b3d2bb45841a276d998e4b6bb5e51aed9af462c`. |
| [BL-0016](delivery/BL-0016.md) | complete | Front-office CI/Docker green; отдельная read-only live same-origin проверка пройдена в обеих средах. |
| [BL-0017](delivery/BL-0017.md) | complete | Back-office CI/Docker green; отдельная read-only live same-origin проверка пройдена в обеих средах. |
| [BL-0018](delivery/BL-0018.md) | complete | Development traceable по head SHA run и трём immutable image digest; health проверен отдельно. |
| [BL-0019](delivery/BL-0019.md) | complete | Тег `staging-v0.1.2` развернул три immutable digest без rebuild/latest; production исключён. |

## Карточки

### [backend](backend/INDEX.md)

- [BL-0001.md](backend/BL-0001.md)
- [BL-0002.md](backend/BL-0002.md)
- [BL-0003.md](backend/BL-0003.md)
- [BL-0004.md](backend/BL-0004.md)
- [BL-0005.md](backend/BL-0005.md)
- [BL-0006.md](backend/BL-0006.md)

### [front-office](front-office/INDEX.md)

- [BL-0007.md](front-office/BL-0007.md)
- [BL-0008.md](front-office/BL-0008.md)

### [back-office](back-office/INDEX.md)

- [BL-0009.md](back-office/BL-0009.md)
- [BL-0010.md](back-office/BL-0010.md)

### [delivery](delivery/INDEX.md)

- [BL-0011.md](delivery/BL-0011.md)
- [BL-0012.md](delivery/BL-0012.md)
- [BL-0013.md](delivery/BL-0013.md)
- [BL-0014.md](delivery/BL-0014.md)
- [BL-0015.md](delivery/BL-0015.md)
- [BL-0016.md](delivery/BL-0016.md)
- [BL-0017.md](delivery/BL-0017.md)
- [BL-0018.md](delivery/BL-0018.md)
- [BL-0019.md](delivery/BL-0019.md)

Архитектура поставки: [ADR-002-delivery-topology.md](../../../20-architecture/ADR/ADR-002-delivery-topology.md). Текущее доказательство CI: [CI-CD.md](../../../70-deployment/CI-CD.md).
