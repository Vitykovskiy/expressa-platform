# E01 — Фундаменты репозиториев и поставки

Статус сверяется с текущим кодом, локальными проверками и GitHub Actions. `complete` означает, что критерии этой карточки доказаны; `in progress` и `blocked` не являются закрытием задачи.

| Карточка | Статус | Доказательство или незакрытая граница |
| --- | --- | --- |
| [[backend/BL-0001\|BL-0001]] | complete | Автономный NestJS-проект, lock-файл, документация; Backend CI 30727498998 успешен. |
| [[backend/BL-0002\|BL-0002]] | complete | Валидация окружения и `.env.example` трёх приложений проверены в тестах и CI. |
| [[backend/BL-0003\|BL-0003]] | in progress | Основание: миграции и seed чистой базы; заказ и сквозная E2E-проверка принадлежат следующим эпикам. |
| [[backend/BL-0004\|BL-0004]] | complete | `/api/v1`, OpenAPI и Swagger-конфигурация покрыты backend-тестами. |
| [[backend/BL-0005\|BL-0005]] | in progress | Основание: health, requestId, журналы и остановка; метрики и alerts принадлежат E12. |
| [[backend/BL-0006\|BL-0006]] | in progress | Основание: bootstrap administrator и staff CLI; вход и runtime-права принадлежат E04. |
| [[front-office/BL-0007\|BL-0007]] | in progress | Основание: автономная PWA-оболочка и CI; публичное меню принадлежит E05. |
| [[front-office/BL-0008\|BL-0008]] | complete | Локальные маршруты, состояние, API-клиент, error UI и OpenAPI snapshot проверены. |
| [[back-office/BL-0009\|BL-0009]] | in progress | Основание: автономная PWA-оболочка и CI; вход staff и рабочие сценарии принадлежат E04/E08/E11. |
| [[back-office/BL-0010\|BL-0010]] | in progress | Основание: маршруты-заглушки, store, API-клиент и ошибки; права и действия принадлежат следующим эпикам. |
| [[delivery/BL-0011\|BL-0011]] | complete | Backend Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0012\|BL-0012]] | complete | Front-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0013\|BL-0013]] | complete | Back-office Dockerfile непривилегирован, имеет health-check; Docker build прошёл CI. |
| [[delivery/BL-0014\|BL-0014]] | complete | Local/development/staging/production определены; development и staging развернуты, production отсутствует по плану. |
| [[delivery/BL-0015\|BL-0015]] | complete | Backend CI, development delivery и tagged staging подтверждены успешными runs. |
| [[delivery/BL-0016\|BL-0016]] | in progress | CI и tagged staging доказаны; автоматический same-origin check development/staging не доказан. |
| [[delivery/BL-0017\|BL-0017]] | in progress | CI и tagged staging доказаны; автоматический same-origin check development/staging не доказан. |
| [[delivery/BL-0018\|BL-0018]] | complete | `main` автоматически развернул development; набор проверен по health и browser-check. |
| [[delivery/BL-0019\|BL-0019]] | in progress | Основание: независимые теги и immutable staging; post-MVP promotion принадлежит E12. |

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
