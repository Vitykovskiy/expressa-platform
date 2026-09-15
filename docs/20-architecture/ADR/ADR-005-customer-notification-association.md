---
title: Связь customer-уведомлений с браузером и logout
type: adr
status: accepted-required
owner: root
date: 2026-09-13
last_verified: 2026-09-14
sources:
  - ../../40-features/Track-history-and-repeat-order.md
  - ../../50-interfaces/Push-notifications.md
  - ../../../backend/src/auth/application/logout.use-case.ts
  - ../../../backend/src/notifications/adapters/postgres-push-subscription.repository.ts
---

# ADR-005: связь customer-уведомлений с браузером и logout

## Статус реализации

Ниже зафиксирован принятый целевой контракт. Текущий runtime ещё отзывает при
logout только сессию и не гарантирует отвязку browser subscription; поэтому
документ не является утверждением о уже поставленном поведении.

## Контекст

Browser permission, локальная `PushSubscription`, её серверная связь с customer
и авторизованная сессия — разные состояния. Push нужен, чтобы customer получал
изменения заказа после закрытия или ухода PWA в background. Поэтому закрытие
приложения не должно отключать доставку, но явный logout обязан прекратить
доставку заказов вышедшего customer именно в текущем браузере.

## Решение

- Закрытие/background не меняют permission, локальную подписку или серверную
  связь.
- Явный logout атомарно отзывает текущую refresh-сессию и удаляет только связь
  переданной текущим браузером подписки с customer этой сессии. Permission и
  локальная `PushSubscription` остаются; остальные браузеры customer не
  затрагиваются.
- После следующего входа подписка не связывается автоматически. Только явное
  «Включить уведомления» создаёт связь; существующая локальная подписка может
  быть повторно использована внутри реализации.
- Одна endpoint/key capability связана не более чем с одним customer, у одного
  customer может быть несколько browser capabilities. Сервер не раскрывает
  другого владельца клиенту.

`POST /api/v2/auth/logout` получает совместимое необязательное поле
`pushSubscription: PushSubscription | null`. Объект имеет ровно
`endpoint: string` (непустой absolute HTTPS URL) и
`keys: { p256dh: string; auth: string }` (непустые строки). Поля
`expirationTime` нет; неизвестные поля wrapper/object/keys отклоняются как
`400 VALIDATION_ERROR`.

- Отсутствующее поле сохраняет прежний session-only контракт для старых и
  back-office клиентов.
- Новый customer front-office всегда передаёт объект после успешного чтения
  текущей подписки; `null` допустим только после подтверждённого отсутствия
  подписки или отсутствия Push API.
- С объектом backend в одной PostgreSQL transaction блокирует и проверяет
  refresh-сессию, получает её `user_id`, удаляет только строку с совпавшими
  `user_id`, `endpoint`, `p256dh` и `auth`, отзывает сессию и фиксирует transaction.
  Отсутствующая строка или строка другого владельца считается уже отвязанной от
  выходящего customer и не раскрывается.
- Объект является capability-proof текущего браузера. При active refresh-session
  backend удаляет только совпавшую с её `user_id` association и отзывает
  session. При missing, malformed, expired или mismatched refresh credential
  backend в transaction удаляет только строку, совпавшую по полным
  `endpoint + p256dh + auth`, независимо от owner, и не отзывает неизвестную
  session. Это capability-only privacy fallback без чтения или раскрытия owner;
  он возвращает `204` и очищает cookie. Exact replay уже зафиксированного
  logout с той же session id/hash также даёт `204`.
  Недоступность session storage даёт `503 SERVICE_UNAVAILABLE`, cookie остаётся.
- Ошибка validation не начинает transaction. Ошибка БД откатывает и отвязку, и
  отзыв сессии; cookie очищается только после успешного `204`.
- Повтор того же logout после потерянного ответа идемпотентен для той же пары
  session id/hash, даже если этот logout уже отозвал сессию. Другой hash не
  принимается. `null` и отсутствующее поле используют legacy session-only
  ветку: missing/invalid refresh credential остаётся успешным `204` с очисткой
  cookie; storage failure даёт `503` без очистки.

Если front-office не может надёжно прочитать локальную подписку, он не заявляет
успешный выход: остаётся в авторизованном состоянии и даёт одну повторную
попытку. Гарантия `204` зависит от payload:

- omitted или `null` — только legacy session logout: cookie очищена, а
  подтверждённая active session отозвана; backend association не меняется;
- объект — session logout плюс отсутствие точной
  `endpoint + p256dh + auth` backend association. При active session она
  отозвана; при invalid/missing credential неизвестная server session не
  считается отозванной, но caller logout завершается очисткой cookie.

Сообщение, уже переданное push-provider до commit, может быть показано; новые
выборки адресатов после commit исключают отвязанную запись. Все успешные logout
ветки сохраняют browser permission и локальную PushSubscription; удаляется
только backend association.

## Privacy и UX-инварианты

Обычный UI не показывает endpoint, ключи, association/version, владельца или
термины «подписка/привязка устройства». Гость видит в «Аккаунте» только
предложение войти и не запускает notification inspection. Permission браузера
не отзывается при logout; это пользовательская настройка браузера/ОС.

## Отклонённые варианты

- Сохранить доставку после logout: нарушает приватность общего браузера.
- Удалять все подписки customer: ломает независимость нескольких устройств.
- Вызывать local `unsubscribe()` при любой logout-ветке: смешивает permission/capability с
  серверной связью и мешает безопасному повторному явному включению.
- Отзывать сессию и отвязывать endpoint двумя независимыми запросами: оставляет
  частично успешное состояние и не даёт правдивой семантики logout.

## Пересмотр

Решение пересматривается, если браузерный API перестанет позволять получить
текущую capability до logout либо появится подтверждённое требование управлять
всеми устройствами аккаунта. Это будет отдельный продуктовый и API-контракт.
