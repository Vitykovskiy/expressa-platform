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
форматирует номер; submit не испускается до этого условия. Заголовок —
«Введите номер телефона». Обычный вход поясняет «Подтвердите номер, чтобы
оформить заказ и посмотреть историю заказов.», вход из checkout — «Подтвердите
номер, чтобы оформить заказ.», из history — «Подтвердите номер, чтобы
посмотреть историю заказов.»; видимого label нет, но программное имя
поля «Номер телефона», placeholder `+7 (___) ___-__-__`, action «Получить код».
OTP принимает ровно шесть цифр в одном поле с поддержкой вставки; заголовок —
«Введите код», пояснение — «Отправили код на {phone}. Введите его для
подтверждения.». Видимого label и видимой подсказки о шести цифрах нет; программное имя «Шестизначный код из
сообщения», placeholder `000000`, action «Подтвердить». Проверка и
повтор блокируются при loading, при этом форма и введённый код остаются на
месте. До разрешённого сервером времени повтор недоступен с остатком секунд, а
после успешной повторной отправки очищается только введённый код. Если клиент
не получил надёжное время ожидания, он сообщает rate limit и оставляет один
доступный повтор без выдуманного отсчёта. Ошибка состояния сразу показывается
рядом с полем через `UiFieldMessage`.
[Источник: AuthForm](../../src/features/auth/AuthForm.vue).

`returnTo` принимается только если начинается с одиночного `/` и не ведёт на
auth-маршруты; `//`, внешний URL и auth-пути заменяются default `/`.
Невалидный или истёкший OTP-экран перенаправляется на телефон с reason.
[Источники: AuthCodePage](../../src/pages/AuthCodePage.vue), [router](../../src/app/router.ts).

## Required protected-session recovery

Пока восстанавливается защищённая сессия, история и заказ не показывают старые
данные или ложное «0 заказов». При terminally invalid/absent session приложение
очищает защищённое состояние и заменяет маршрут на вход с безопасным `returnTo`.
Один 401 чтения может присоединиться к единому восстановлению; успешное
восстановление повторяет безопасное чтение один раз. Terminal failure ведёт ко
входу, transient failure скрывает защищённое содержимое и показывает «Не
удалось восстановить вход. Проверьте подключение и попробуйте ещё раз» с одним
повтором. Нет циклов и автоматического повтора мутаций.

Нажатие notification использует только валидный внутренний заказ: после входа
возвращает к нему; чужой или отсутствующий заказ сообщает «Заказ недоступен.»
и ведёт к истории/меню без раскрытия данных и без выхода из действующего
аккаунта. В affected order/history/account journeys не показываются
`Unauthorized`, HTTP-коды или `Error.message`. Это **required** до реализации.

`AuthScreen` публикует loading через `aria-busy`/live region, поля и кнопки
имеют подписи; адаптивный layout остаётся в компоненте. [Источник: screen](../../src/features/auth/AuthScreen.vue).

Проверки: [router spec](../../src/app/router.spec.ts), [phone spec](../../src/pages/AuthPhonePage.spec.ts), [code spec](../../src/pages/AuthCodePage.spec.ts), [composition spec](../../src/pages/AuthCodePage.composition.spec.ts), [form spec](../../src/features/auth/AuthForm.spec.ts).

Карта раздела: [сценарии](INDEX.md).

## Accepted target: Account и logout

Гостевой Account показывает ровно заголовок «Аккаунт», «Вы не вошли в аккаунт»
и «Войти», без дополнительного объяснения. Он не проверяет permission, local
subscription или server association и не показывает «Проверяем уведомления…».

Customer logout сначала получает текущую PushSubscription. Объект передаётся
в POST /api/v2/auth/logout; null используется только при подтверждённом
отсутствии или unsupported Push API. При невозможности чтения либо неуспешном
API transport/503 клиент остаётся authenticated, показывает понятную ошибку и
одну «Повторить». Structurally valid object-body не имеет credential-401:
backend при недействительном refresh использует capability-only detach. 204
очищает session/customer state и переводит Account в guest. Клиент не вызывает
local unsubscribe; permission, локальная PushSubscription и другие браузеры
всегда сохраняются.
После следующего входа уведомления включаются только явным действием.

Это принятый target, ещё не полностью реализованный runtime contract.
[API](../../../docs/50-interfaces/Authentication-API.md),
[ADR](../../../docs/20-architecture/ADR/ADR-005-customer-notification-association.md).
