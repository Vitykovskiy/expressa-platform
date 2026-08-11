---
type: feature
owner: front-office
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/pages/AuthPhonePage.vue
  - ../../src/pages/AuthCodePage.vue
  - ../../src/features/auth/AuthForm.vue
---

# Вход и returnTo

Вход по телефону запрашивает OTP, проверяет его и возвращает посетителя только
во внутренний путь. Защищённые routes требуют customer-сессии. [Источники: router](../../src/app/router.ts), [phone page](../../src/pages/AuthPhonePage.vue).

Телефонная форма оставляет только цифры для проверки, требует минимум 10 цифр и
форматирует номер; submit не испускается до этого условия. OTP принимает ровно
шесть цифр; проверка и повтор блокируются при loading. Ошибка состояния сразу
показывается через `UiFieldMessage`.
[Источник: AuthForm](../../src/features/auth/AuthForm.vue).

`returnTo` принимается только если начинается с одиночного `/` и не ведёт на
auth-маршруты; `//`, внешний URL и auth-пути заменяются default `/`.
Невалидный или истёкший OTP-экран перенаправляется на телефон с reason.
[Источники: AuthCodePage](../../src/pages/AuthCodePage.vue), [router](../../src/app/router.ts).

`AuthScreen` публикует loading через `aria-busy`/live region, поля и кнопки
имеют подписи; адаптивный layout остаётся в компоненте. [Источник: screen](../../src/features/auth/AuthScreen.vue).

Проверки: [router spec](../../src/app/router.spec.ts), [phone spec](../../src/pages/AuthPhonePage.spec.ts), [code spec](../../src/pages/AuthCodePage.spec.ts).
