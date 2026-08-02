# E01 — Фундаменты репозиториев и поставки

Статус сверяется с текущим кодом, локальными проверками и GitHub Actions. `complete` означает, что критерии этой карточки доказаны; `in progress` и `blocked` не являются закрытием задачи.

| Карточка | Статус | Доказательство или незакрытая граница |
| --- | --- | --- |
| [[backend/BL-0001\|BL-0001]] | complete | Автономный NestJS-проект, lock-файл, документация; Backend CI 30727498998 успешен. |
| [[backend/BL-0002\|BL-0002]] | complete | Валидация окружения и `.env.example` трёх приложений проверены в тестах и CI. |
| [[backend/BL-0003\|BL-0003]] | in progress | Миграции и чистая база есть; полный маршрут заказа до выдачи относится к последующим эпикам. |
| [[backend/BL-0004\|BL-0004]] | complete | `/api/v1`, OpenAPI и Swagger-конфигурация покрыты backend-тестами. |
| [[backend/BL-0005\|BL-0005]] | in progress | Health, request ID и shutdown есть; экспорт метрик и alerts отсутствуют. |
| [[backend/BL-0006\|BL-0006]] | in progress | Bootstrap ролей и staff-сценарий не доказаны полным DoD. |
| [[front-office/BL-0007\|BL-0007]] | in progress | Каркас и CI есть; приёмочный публичный menu-сценарий ещё не реализован. |
| [[front-office/BL-0008\|BL-0008]] | complete | Локальные маршруты, состояние, API-клиент, error UI и OpenAPI snapshot проверены. |
| [[back-office/BL-0009\|BL-0009]] | in progress | Каркас и CI есть; staff-сценарий после входа ещё не реализован. |
| [[back-office/BL-0010\|BL-0010]] | in progress | API-клиент и error UI есть; права и рабочие разделы не доказаны. |
| [[delivery/BL-0011\|BL-0011]] | complete | Backend Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0012\|BL-0012]] | complete | Front-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0013\|BL-0013]] | complete | Back-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0014\|BL-0014]] | in progress | Bootstrap и изоляция VPS приняты read-only аудитом; контейнеры приложений отсутствуют. |
| [[delivery/BL-0015\|BL-0015]] | in progress | Backend CI успешен; development deploy и tagged staging не доказаны. |
| [[delivery/BL-0016\|BL-0016]] | in progress | Front-office CI успешен; development E2E и tagged staging не доказаны. |
| [[delivery/BL-0017\|BL-0017]] | in progress | Back-office CI успешен; development E2E и tagged staging не доказаны. |
| [[delivery/BL-0018\|BL-0018]] | blocked | Два development delivery запуска остановились на GHCR package authorization; приложения не развёрнуты. |
| [[delivery/BL-0019\|BL-0019]] | blocked | Нет опубликованных release digest, staging-манифеста и staging-тега. |

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
