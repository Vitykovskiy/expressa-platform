---
title: "Проверка front-office"
type: verification
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/app/App.spec.ts
knowledge_role: requirements
scope: front-office
---

# Проверка front-office

Команды и параметры принадлежат [package.json](../../package.json). `lint`,
`typecheck` и `build` проверяют код; `contract:check` сверяет
OpenAPI.

| Сценарий                               | Основные доказательства                                                                                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Меню, навигация, конфигурация, корзина | [shell spec](../../src/widgets/customer-shell/ShellNavigation.spec.ts), [MenuFlow spec](../../src/features/menu/MenuFlow.spec.ts), [cart store spec](../../src/entities/customer/model/cart.store.spec.ts) |
| Phone/OTP и безопасный возврат         | [form spec](../../src/features/auth/AuthForm.spec.ts), [страницы auth](../../src/pages/AuthCodePage.spec.ts)                                                                                               |
| Оформление и ошибки API                | [checkout store spec](../../src/features/checkout/checkout.store.spec.ts), [orders API spec](../../src/shared/api/orders.api.spec.ts)                                                                      |

Покрытие объектов и их основные ноты: [COVERAGE](../COVERAGE.md).

Тестовые файлы в таблице — существующие исходники, не доказательство выполненного прогона. Создание, изменение и запуск тестов допустимы только по [корневым ограничениям](../../../AGENTS.md).

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

## Customer-контекст и регистрация

Реализация [auth API](../../src/shared/api/auth.api.ts) отправляет
`context=customer` при OTP verify, проверяет обязательные nullable memberships
и отображает DTO в профиль без scalar role. [Session store](../../src/app/session.store.ts)
и [маршрутизатор](../../src/app/router.ts) определяют enrollment по customer,
а [страница имени](../../src/pages/AuthNamePage.vue) принимает новое имя либо
подтверждает сохранённое без редактирования. Источник ожидаемого поведения —
[контракт входа](../30-features/Authentication-and-returnTo.md).

Ручная приёмка проверяет unnamed account, named employee без customer,
зарегистрированного клиента, staff-context, безопасный returnTo, 409 name conflict,
неопределённый результат и повтор, поздний ответ после выхода/замены сессии,
ошибку logout и сохранность корзины до успешного выхода. Push до регистрации
не доказывает enrollment; существующий invitation UI не расширяется.
Предпочтительный режим браузерных проверок — headless.

Для текущей партии lint и contract:check выполнены. Полные typecheck/build
блокируются устаревшими fixtures в существующих
`session.store.spec.ts` и `OrdersPage.spec.ts`; тесты не исправлялись и не
запускались. Browser-приёмка изменённых registration-состояний пока не
подтверждена: нужны совместный runtime и customer-context session.
Статическая проверка и доступность phone-формы не заменяют эту приёмку.
