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
OpenAPI.

| Сценарий                                                              | Основные доказательства                                                                                                                                                                                    |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Меню, навигация, конфигурация, корзина                                | [shell spec](../../src/widgets/customer-shell/ShellNavigation.spec.ts), [MenuFlow spec](../../src/features/menu/MenuFlow.spec.ts), [cart store spec](../../src/entities/customer/model/cart.store.spec.ts) |
| Phone/OTP и безопасный возврат                                        | [form spec](../../src/features/auth/AuthForm.spec.ts), [страницы auth](../../src/pages/AuthCodePage.spec.ts)                                                                                               |
| Оформление и ошибки API                                               | [checkout store spec](../../src/features/checkout/checkout.store.spec.ts), [orders API spec](../../src/shared/api/orders.api.spec.ts)                                                                      |
| Покрытие объектов и их авторитетные ноты: [COVERAGE](../COVERAGE.md). |

Visual snapshots с OS suffix — evidence, созданное на указанной платформе из
одной revision, а не ветка дизайна. Darwin image нельзя выдавать за Linux или
копировать в Linux baseline. Если текущий Linux прогон недоступен, Linux
visual verification записывается `unable_to_verify`; старый baseline не
принимается как актуальный.

Проверка mobile header подтверждает один left-aligned button «Экспресса» без
House с именем «Перейти в меню»: он возвращает в root с history, cart, auth,
category, product и order detail. Contextual `Назад` проверяется в отдельной
left-aligned row под header и перед primary content, а не в header или title
row; Account, History и Cart сохраняют позиции для guest и authenticated
sessions.
