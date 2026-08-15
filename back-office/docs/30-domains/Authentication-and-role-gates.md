---
title: Вход и ролевые ограничения back-office
type: feature
implementation_status: current
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../src/pages/LoginPage.vue
  - ../../src/app/session.store.ts
  - ../../src/app/router.ts
  - ../../src/pages/admin/auth/AuthScreen.vue
---

# Вход и ролевые ограничения

`/login` — активный маршрут. `LoginPage` владеет черновиками телефона и OTP, вызывает session store и отображает `AuthScreen` как дочерний UI. Источники: [LoginPage.vue](../../src/pages/LoginPage.vue), [AuthScreen.vue](../../src/pages/admin/auth/AuthScreen.vue), [маршрут](../../src/app/router.constants.ts).

Пользователь вводит 11 цифр российского номера: страница форматирует их как `+7`, не отправляет неверный номер и выводит локальную ошибку. После успешного `requestOtp` доступен шестизначный код; «изменить номер» очищает OTP, «повторить» очищает оба черновика. Неверная длина кода не вызывает API. `loading` блокирует форму, `denied` показывает отказ, а успешная staff-сессия переводит на `/queue`. Источники: [LoginPage.vue](../../src/pages/LoginPage.vue), [auth E2E](../../tests/e2e/auth.e2e.ts).

Session store вызывает request/verify/refresh/logout и `GET /me`. Только `barista` и `administrator` становятся `authenticated`; `customer` вызывает logout и получает `denied`. `401` очищает сессию, иная ошибка сохраняет безопасное сообщение и request ID. Guard восстанавливает unknown-сессию один раз, направляет анонимного сотрудника на `/login`, не пускает роль вне `allowedRoles`, а авторизованного на `/login` возвращает в первый доступный раздел. Источники: [session.store.ts](../../src/app/session.store.ts), [router.ts](../../src/app/router.ts), [router.spec.ts](../../src/app/router.spec.ts).

`AuthScreen` показывает phone, otp, loading, denied и success states; поля имеют подписанные labels, ошибка представлена наблюдаемым текстом. Это presentation-компонент: HTTP, навигация и сессия остаются у `LoginPage` и store. Источники: [AuthScreen.vue](../../src/pages/admin/auth/AuthScreen.vue).
