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
OpenAPI; `storybook:build`, `test:a11y`, `test:visual` проверяют каталог и UI;
`test:e2e` запускает приложение.

| Сценарий | Основные доказательства |
|---|---|
| Меню, конфигурация, корзина | [MenuPage spec](../../src/pages/MenuPage.spec.ts), [MenuFlow spec](../../src/features/menu/MenuFlow.spec.ts), [cart store spec](../../src/entities/customer/model/cart.store.spec.ts) |
| OTP и безопасный возврат | [router spec](../../src/app/router.spec.ts), [страницы auth](../../src/pages/AuthCodePage.spec.ts) |
| Оформление и ошибки API | [checkout store spec](../../src/features/checkout/checkout.store.spec.ts), [orders API spec](../../src/shared/api/orders.api.spec.ts) |
| Браузерные сценарии | [Playwright e2e](../../tests/e2e) |

Покрытие объектов и их авторитетные ноты: [COVERAGE](../COVERAGE.md).
