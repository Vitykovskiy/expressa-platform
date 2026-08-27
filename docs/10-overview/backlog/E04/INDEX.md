# E04 — Телефонная авторизация и доступ

[К backlog](../INDEX.md).

Статус: complete.

E04 реализует основу аутентификации, сессии и доступа. Бизнес-обработчики
меню, заказа и доступности остаются в эпиках [E06](../E06/backend/BL-0083.md),
[E07: customer-сессия для `POST /orders`](../E07/front-office/BL-0106.md) и
[E07: серверная проверка заказа](../E07/backend/BL-0099.md),
[E08](../E08/backend/BL-0115.md), [E10](../E10/backend/BL-0132.md) и
[E11](../E11/backend/BL-0138.md).

## [backend](backend/INDEX.md)

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [BL-0060.md](backend/BL-0060.md) | complete | [Миграция auth-схемы](../../../../backend/migrations/0003_e04_auth.sql) |
| [BL-0061.md](backend/BL-0061.md) | complete | [Политика OTP и тесты](../../../../backend/src/auth/domain/otp-policy.spec.ts) |
| [BL-0062.md](backend/BL-0062.md) | complete | [OpenAPI auth-маршрутов](../../../../backend/openapi/openapi.json) |
| [BL-0063.md](backend/BL-0063.md) | complete | [SMS.RU-адаптер](../../../../backend/src/auth/adapters/sms-ru-sms.sender.ts) |
| [BL-0064.md](backend/BL-0064.md) | complete | [Проверка OTP и тесты](../../../../backend/src/auth/application/verify-otp.use-case.spec.ts) |
| [BL-0065.md](backend/BL-0065.md) | complete | [Refresh-сессия и тесты](../../../../backend/src/auth/application/refresh-session.use-case.spec.ts) |
| [BL-0066.md](backend/BL-0066.md) | complete | [Guards ролей и тесты](../../../../backend/src/auth/transport/roles.guard.spec.ts) |

## [front-office](front-office/INDEX.md)

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [BL-0067.md](front-office/BL-0067.md) | complete | [Клиент auth API](../../../../front-office/src/shared/api/auth.api.ts) |
| [BL-0068.md](front-office/BL-0068.md) | complete | [Браузерный вход с корзиной](../../../../front-office/tests/e2e/auth.e2e.spec.ts) |
| [BL-0069.md](front-office/BL-0069.md) | complete | [Состояние сессии](../../../../front-office/src/app/session.store.spec.ts) |
| [BL-0070.md](front-office/BL-0070.md) | complete | [Guard маршрутов customer](../../../../front-office/src/app/router.spec.ts) |

## [back-office](back-office/INDEX.md)

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [BL-0071.md](back-office/BL-0071.md) | complete | [Браузерные auth и роли](../../../../back-office/tests/e2e/auth.e2e.ts) |
| [BL-0072.md](back-office/BL-0072.md) | complete | [Локальная документация Storybook](../../../../back-office/docs/INDEX.md) |
| [BL-0073.md](back-office/BL-0073.md) | complete | [Router role policy](../../../../back-office/src/app/router.spec.ts) |

## quality

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [BL-0074.md](quality/BL-0074.md) | complete | [Front-office browser E2E](../../../../front-office/tests/e2e/auth.e2e.spec.ts) и [back-office browser E2E](../../../../back-office/tests/e2e/auth.e2e.ts) |
