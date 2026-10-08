---
title: "Вход и ролевые ограничения"
type: feature
implementation_status: current
owner: back-office
last_verified: 2026-10-08
sources:
  - ../../src/pages/LoginPage.vue
  - ../../src/app/session.store.ts
  - ../../src/app/router.ts
  - ../../src/pages/admin/auth/AuthScreen.vue
knowledge_role: implementation
scope: back-office
---

# Вход и ролевые ограничения

`/login` — активный маршрут. `LoginPage` владеет черновиками телефона и OTP, вызывает session store и отображает `AuthScreen` как дочерний UI. Источники: [LoginPage.vue](../../src/pages/LoginPage.vue), [AuthScreen.vue](../../src/pages/admin/auth/AuthScreen.vue), [маршрут](../../src/app/router.constants.ts).

Пользователь вводит российский номер: `PhoneStep` владеет прогрессивной маской `+7 900 000-00-00` и сохраняет положение ввода при редактировании; `LoginPage` получает уже отформатированный черновик. Десять цифр без кода страны и российский префикс `8` приводятся к `+7`. Запрос разрешён только для полного номера из 11 цифр; неполный номер не отправляется и получает локальную ошибку. Источники маски: [PhoneStep.vue](../../src/pages/admin/auth/PhoneStep.vue), [phone-format.ts](../../src/pages/admin/auth/phone-format.ts). После успешного `requestOtp` доступен шестизначный код; «изменить номер» очищает OTP, «повторить» очищает оба черновика. Неверная длина кода не вызывает API. Cooldown общий с customer для того же номера; при `429` UI показывает предоставленный сервером остаток. Неверный и устаревший OTP остаются на OTP-шаге с отдельным понятным сообщением, а `401` refresh/protected resource очищает сессию. `loading` блокирует форму, `denied` означает, что номер не provisioned как `barista` или `administrator`, а успешная staff-сессия переводит на `/queue`. Источники: [LoginPage.vue](../../src/pages/LoginPage.vue), [session.store.ts](../../src/app/session.store.ts).

Session store вызывает request/verify/refresh/logout и `GET /me`. Только `barista` и `administrator` становятся `authenticated`; `customer` вызывает logout и получает `denied`. `401` очищает сессию, иная ошибка сохраняет безопасное сообщение и request ID. Guard восстанавливает unknown-сессию один раз, направляет анонимного сотрудника на `/login`, не пускает роль вне `allowedRoles`, а авторизованного на `/login` возвращает в первый доступный раздел. Источники: [session.store.ts](../../src/app/session.store.ts), [router.ts](../../src/app/router.ts), [router.spec.ts](../../src/app/router.spec.ts).

`AuthScreen` показывает phone, otp, loading и denied; success означает ожидание перехода и использует loading presentation. Поля имеют подписанные labels; локальная проверка и сопоставленные серверные ошибки полей остаются рядом с полем. Это presentation-компонент: HTTP, навигация и сессия остаются у `LoginPage` и store. Источники: [AuthScreen.vue](../../src/pages/admin/auth/AuthScreen.vue).

Каждый фактически отправленный request/verify/refresh/logout/`GET /me` передаёт отдельный терминальный результат через общий [runtime уведомлений](../../src/app/notifications/notification-runtime.ts), включая восстановление сессии и `401`. Verify и последующее чтение пользователя — два запроса; их результаты не подменяются общим «Вход выполнен» внутри формы. Общее `restorePromise` не создаёт дополнительных запросов. Receipt сохраняется при повторном выбросе ошибки. Правила очереди, восстановления и безопасного результата после завершения сессии находятся в [UI ownership](../10-architecture/ui-ownership.md#результаты-отдельных-http-запросов). Полная интеграционная проверка остаётся отдельным требованием.
