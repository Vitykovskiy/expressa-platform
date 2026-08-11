# E04 — Телефонная авторизация и доступ

Статус: complete.

E04 реализует основу аутентификации, сессии и доступа. Бизнес-обработчики
меню, заказа и доступности остаются в эпиках [[../E06/backend/BL-0083|E06]],
[[../E07/front-office/BL-0106|E07: customer-сессия для `POST /orders`]] и
[[../E07/backend/BL-0099|E07: серверная проверка заказа]],
[[../E08/backend/BL-0115|E08]], [[../E10/backend/BL-0132|E10]] и
[[../E11/backend/BL-0138|E11]].

## backend

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[backend/BL-0060]] | complete | [Миграция auth-схемы](../../../../backend/migrations/0003_e04_auth.sql) |
| [[backend/BL-0061]] | complete | [Политика OTP и тесты](../../../../backend/src/auth/domain/otp-policy.spec.ts) |
| [[backend/BL-0062]] | complete | [OpenAPI auth-маршрутов](../../../../backend/openapi/openapi.json) |
| [[backend/BL-0063]] | complete | [SMS.RU-адаптер](../../../../backend/src/auth/adapters/sms-ru-sms.sender.ts) |
| [[backend/BL-0064]] | complete | [Проверка OTP и тесты](../../../../backend/src/auth/application/verify-otp.use-case.spec.ts) |
| [[backend/BL-0065]] | complete | [Refresh-сессия и тесты](../../../../backend/src/auth/application/refresh-session.use-case.spec.ts) |
| [[backend/BL-0066]] | complete | [Guards ролей и тесты](../../../../backend/src/auth/transport/roles.guard.spec.ts) |

## front-office

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[front-office/BL-0067]] | complete | [Клиент auth API](../../../../front-office/src/shared/api/auth.api.ts) |
| [[front-office/BL-0068]] | complete | [Браузерный вход с корзиной](../../../../front-office/tests/e2e/auth.e2e.spec.ts) |
| [[front-office/BL-0069]] | complete | [Состояние сессии](../../../../front-office/src/app/session.store.spec.ts) |
| [[front-office/BL-0070]] | complete | [Guard маршрутов customer](../../../../front-office/src/app/router.spec.ts) |

## back-office

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[back-office/BL-0071]] | complete | [Браузерные auth и роли](../../../../back-office/tests/e2e/auth.e2e.ts) |
| [[back-office/BL-0072]] | complete | [Локальная документация Storybook](../../../../back-office/docs/INDEX.md) |
| [[back-office/BL-0073]] | complete | [Router role policy](../../../../back-office/src/app/router.spec.ts) |

## quality

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[quality/BL-0074]] | complete | [Front-office browser E2E](../../../../front-office/tests/e2e/auth.e2e.spec.ts) и [back-office browser E2E](../../../../back-office/tests/e2e/auth.e2e.ts) |
