---
type: verification
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/app/App.spec.ts
---

# Проверка front-office

Команды и параметры принадлежат [package.json](../../package.json). `lint`,
`typecheck`, `test -- --run` и `build` проверяют код; `contract:check` сверяет
OpenAPI; `test:e2e` запускает приложение.

| Сценарий | Основные доказательства |
|---|---|
| Меню, конфигурация, корзина | [MenuPage spec](../../src/pages/MenuPage.spec.ts), [MenuFlow spec](../../src/features/menu/MenuFlow.spec.ts), [cart store spec](../../src/entities/customer/model/cart.store.spec.ts) |
| OTP и безопасный возврат | [router spec](../../src/app/router.spec.ts), [страницы auth](../../src/pages/AuthCodePage.spec.ts) |
| Оформление и ошибки API | [checkout store spec](../../src/features/checkout/checkout.store.spec.ts), [orders API spec](../../src/shared/api/orders.api.spec.ts) |
| Браузерные сценарии | [меню](../../tests/e2e/menu.e2e.spec.ts), [вход](../../tests/e2e/auth.e2e.spec.ts), [оформление](../../tests/e2e/checkout.e2e.spec.ts), [push](../../tests/e2e/push.e2e.spec.ts) |

Покрытие объектов и их авторитетные ноты: [COVERAGE](../COVERAGE.md).
