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

OTP нормализует телефон, принимает шесть цифр, действует пять минут и допускает
пять попыток. Повторный запрос блокируется на 60 секунд, пока остаётся открытый
проверяемый challenge; после успешной проверки или исчерпания попыток следующий
запрос сразу создаёт новый. Успешная проверка создаёт или находит customer и
сессию. [Источники: policy](../../backend/src/auth/domain/otp-policy.constants.ts), [verify](../../backend/src/auth/application/verify-otp.use-case.ts), [E2E](../../backend/test/e2e/auth.e2e-spec.ts).

Access token живёт в памяти front- и back-office session stores и идёт в Bearer;
refresh token — HttpOnly strict cookie, ротируется при refresh и отзывается при
logout. Session guard проверяет сессию и актуальную роль; back-office доступен
barista/administrator. Front-office принимает только внутренний `returnTo` и
очищает cart store при успешном logout. [Источники: front session](../../front-office/src/app/session.store.ts), [back session](../../back-office/src/app/session.store.ts), [controller](../../backend/src/auth/transport/auth.controller.ts), [guard](../../backend/src/auth/transport/session.guard.ts), [cart](../../front-office/src/entities/customer/model/cart.store.ts).
