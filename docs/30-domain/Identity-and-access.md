---
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/auth/domain/otp-policy.constants.ts
  - ../../backend/src/auth/transport/auth.controller.ts
  - ../../backend/test/e2e/auth.e2e-spec.ts
---

# Идентификация и доступ

OTP нормализует российский телефон в E.164, принимает шесть цифр, действует
пять минут и допускает пять попыток. На один номер существует ровно один
открытый challenge во всей системе: customer и back-office не имеют отдельных
SMS-каналов. Повторный запрос на этот номер, включая другой клиент или reload,
получает `429 AUTH_RATE_LIMITED` до фактического истечения cooldown; ответ
содержит остаток в `Retry-After`. Параллельные запросы сериализуются: один
создаёт challenge, остальные получают `429`.

Успешная проверка потребляет current challenge. Разрешённый resend потребляет
предыдущий challenge, поэтому старый код недействителен. После успеха или пяти
неверных попыток новый request создаётся сразу; это UX lifecycle, а не
достаточная защита от злоупотреблений. Успешная проверка создаёт или находит
`customer` и сессию. [Источники: policy](../../backend/src/auth/domain/otp-policy.constants.ts), [reserve](../../backend/src/auth/adapters/postgres-auth.repository.ts), [verify](../../backend/src/auth/application/verify-otp.use-case.ts).

Security throttle отделён от UX cooldown: после разрешённой выдачи атомарно
учитываются номер, проверенный адрес источника и общий бюджет SMS в окне один
час. Запрос, отклонённый активным UX cooldown, не расходует этот бюджет; при
исчерпании сервер возвращает остаток окна в `Retry-After`.

Access token живёт в памяти front- и back-office session stores и идёт в Bearer;
refresh token — host-only HttpOnly strict cookie, ротируется при refresh и
отзывается при logout. Независимость customer/staff recoverable sessions
достигается только разными same-origin app hosts; при общем API host они
разделяют cookie и не должны развёртываться как независимые сессии. Каждый UI
проксирует свой `/api/v2`; локальная конфигурация также использует relative API
path через Vite proxy, а не общий абсолютный API origin. Session
guard проверяет сессию и актуальную роль; back-office доступен
barista/administrator, которых заранее provisioned оператор. Front-office принимает только внутренний `returnTo` и
очищает cart store при успешном logout. [Источники: front session](../../front-office/src/app/session.store.ts), [back session](../../back-office/src/app/session.store.ts), [controller](../../backend/src/auth/transport/auth.controller.ts), [guard](../../backend/src/auth/transport/session.guard.ts), [cart](../../front-office/src/entities/customer/model/cart.store.ts).
