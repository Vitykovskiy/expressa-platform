---
title: "Вход и безопасный returnTo"
type: feature
owner: front-office
last_verified: 2026-10-27
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/auth.api.ts
  - ../../src/app/session.store.ts
  - ../../../docs/20-architecture/ADR/ADR-017-account-memberships-and-session-context.md
knowledge_role: requirements
scope: front-office
---

# Вход и безопасный returnTo

## Целевой вход и регистрация

[ADR-017](../../../docs/20-architecture/ADR/ADR-017-account-memberships-and-session-context.md)
позволяет сотруднику использовать тот же телефон в customer-приложении.
Клиент явно передаёт `context=customer` при v2 OTP verify. Восстановление
и `/me` проверяют весь профиль по
[HTTP-контракту](../../../docs/50-interfaces/Authentication-API.md#профиль-и-совместимое-поле-role),
а не scalar role. Missing context/membership/name — ошибка контракта;
разрешённый `customer=null` означает незавершённую регистрацию.

Готовность клиента определяется customer-участием, не `name!=null`.
Customer-context без участия проходит `/auth/name`, включая employee с уже
известным именем. Unnamed account вводит имя через существующую форму;
named employee подтверждает каноническое имя без редактирования. Оба отправляют
одну существующую команду регистрации. Нельзя пропустить enrollment из-за
staff-роли или непустого имени. После сохранения профиль содержит customer;
повторный вход зарегистрированного клиента пропускает регистрацию и продолжает
безопасный внутренний `returnTo`. Name conflict показывается явно, без
перезаписи личности. Правила допустимого имени и concurrent/repeat поведения
принадлежат [API регистрации](../../../docs/50-interfaces/Authentication-API.md#первое-имя-клиента).

Восстановленный customer-context без участия завершает шаг перед cart,
history/detail и явным входом, включая прямую ссылку. Меню остаётся публичным.
Сотрудник в customer-контексте получает только собственные customer-заказы;
staff-context не получает registration/order доступ. Push-success не доказывает
регистрацию: existing v2 push допускает customer-context до enrollment, без
нового invitation UI. Общий host не обещает независимости recoverable-сессий;
[доменная граница](../../../docs/30-domain/Identity-and-access.md#контекст-и-политики)
сохраняется.

## Возврат, состояние и ошибки

Внутренние адреса проверяет [auth-return](../../src/shared/lib/auth-return.ts).
`/auth/name` исключён из returnTo, как phone/code; внешние/неверные адреса
не принимаются. Действующий зарегистрированный профиль продолжает исходную
защищённую цель. Страница владеет черновиком/подтверждением, session store —
проверенной идентичностью и сохранением; нет второй изменяемой копии профиля.
API проверяет полную внешнюю форму. При завершении регистрации session store
подтверждает тот же account, телефон, context и completed membership перед
публикацией зарегистрированного профиля; до регистрации customer-context
остаётся аутентифицированным и допускается к шагу enrollment.

Ошибка сохраняет ввод/состояние подтверждения; pending блокирует повтор.
Завершение и навигация привязаны к account/session generation; ответ прежнего
аккаунта после выхода/смены не восстанавливает его. App передаёт узкий
feature-контекст регистрации: account/phone/pending, команду и актуальность;
страница не получает токены, весь store или произвольные session-команды.
Пути остаются у `shared/config/customer-routes.constants.ts`.
Cart/logout ownership и восстановление ошибок сохраняются. Успешный logout
очищает клиентскую корзину; его body и exact-proof правила принадлежат
[ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md)
с контекстной активной веткой ADR-017.

## Граница реализации и приёмки

На 2026-10-27 session store определяет завершение по customer-участию,
принимает customer-контекст и проверяет полный профиль; scalar role остаётся
только проверяемым полем DTO. Наличие имени не пропускает регистрацию.
Это описание исходников, не самостоятельный вердикт браузерной приёмки.
Маршруты и HTTP-потребитель находятся в
[router](../../src/app/router.ts), [auth API](../../src/shared/api/auth.api.ts),
[session store](../../src/app/session.store.ts). Публикация snapshot и работающий
сценарий имеют отдельные доказательства. Полные typecheck/build пока не проходят
из-за неизменённых spec-исходников; тестовые файлы остаются нетронутыми.

BO Figma определяет смысл участий, но не новый FO-дизайн. Changed entry/name
confirmation/returnTo/error-состояния используют существующий
[FO UI contract](../30-conventions/UI-contracts.md) и требуют финального
осмотра/независимой проверки по
[Validation-strategy](../../../docs/40-quality/Validation-strategy.md).
Тесты не создаются, не меняются и не запускаются без условий корневого AGENTS.
