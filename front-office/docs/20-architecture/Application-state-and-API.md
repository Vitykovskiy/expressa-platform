---
type: state-and-api
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/app/session.store.ts
  - ../../src/shared/api/client.ts
---

# Состояние приложения и API

Pinia хранит только клиентское состояние; HTTP-сервисы проверяют ответ до
передачи его экрану. [Источники: session store](../../src/app/session.store.ts),
[client](../../src/shared/api/client.ts).

| Владелец   | Переходы и граница                                                                                                               | Источник                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `session`  | `unknown` восстанавливается через refresh; customer-токен и `/me` дают `authenticated`; logout очищает сессию и корзину          | [store](../../src/app/session.store.ts)                  |
| `menu`     | `idle/loading/ready/error`; параллельная загрузка объединяется, ready не загружается повторно                                    | [store](../../src/entities/customer/model/menu.store.ts) |
| `cart`     | конфигурации с одинаковыми товаром, вариантом и опциями объединяются; localStorage восстанавливается только после проверки формы | [store](../../src/entities/customer/model/cart.store.ts) |
| `checkout` | submit блокирует повтор; успех хранит заказ; network можно повторить, изменение суммы требует подтверждения                      | [store](../../src/features/checkout/checkout.store.ts)   |

`auth.api` отправляет OTP, refresh/logout с credentials и `/me` с Bearer;
`public-menu.api` получает публичное меню; `orders.api` создаёт заказ с
idempotency key. Контракт задаёт OpenAPI, сервисы преобразуют DTO в модели.
[Источники: auth](../../src/shared/api/auth.api.ts), [menu](../../src/shared/api/public-menu.api.ts),
[orders](../../src/shared/api/orders.api.ts), [OpenAPI](../../contracts/openapi.json).

Ошибка HTTP становится `ApiError` с status/code/message/details/requestId;
feature переводит её в видимое состояние, а не раскрывает DTO в шаблоне.
[Источники: client](../../src/shared/api/client.ts), [checkout](../../src/features/checkout/checkout.store.ts).

`App` восстанавливает корзину и сессию до показа маршрута. `ErrorNotice` читает
`appStore.screenError`, который изначально `null`; при non-null выводит message,
optional request id и по «Закрыть» очищает store. Текущие session и feature
stores сохраняют сообщения ошибок в собственном состоянии.
[Источники: App](../../src/app/App.vue), [store](../../src/app/app.store.ts),
[notice](../../src/shared/ui/ErrorNotice.vue).

В production регистрируется service worker; development его не регистрирует.
Обновлённый worker ожидает стандартное `SKIP_WAITING` message. При явной
browser reload navigation PWA bootstrap посылает его, только когда prompt
callback сообщает о waiting worker; тогда worker активируется и захватывает
клиенты. Обычная открытая сессия не перезагружается из-за найденного обновления,
а после закрытия всех клиентов worker активируется по обычному lifecycle перед
следующим запуском. Nginx требует revalidation для worker и `index.html`;
внутренний SPA fallback также отдаёт этот `index.html`.
[Источники: PWA](../../src/app/pwa.ts), [worker](../../src/app/push-notifications.ts),
[Nginx](../../nginx.conf).

## Accepted target: notification, session и Account

Notification store отдельно хранит support/permission, локальную transient
capability, server association и один сериализованный operation state. Секреты
подписки не попадают в local storage. Гостевое состояние не запускает
inspection; после входа нет автоматической association. other — внутреннее
состояние: UI показывает обычное выключенное состояние, а явное включение
выполняет безопасный transfer без раскрытия owner.

Перед customer logout session owner надёжно читает текущую capability и
передаёт её в расширенный logout API. До успешного 204 клиент сохраняет
авторизованное состояние; ошибка чтения, transport или 503 даёт одну повторную
попытку полного logout. Structurally valid object-body не получает credential
401: backend использует capability-only detach, если refresh credential
недействителен. После 204 открывается обычный guest. Клиент никогда не вызывает
local unsubscribe при logout.
После 204 session и customer-scoped notification state очищаются, но browser
permission и локальная capability остаются. App остаётся единственным
владельцем accountOpen; диалог только сообщает close, а returnFocusTo
является исключительно focus target.

Это принятый target, ещё не реализованный полностью в runtime. Details:
[ADR-005](../../../docs/20-architecture/ADR/ADR-005-customer-notification-association.md).

Проверки: [session](../../src/app/session.store.spec.ts), [API](../../src/shared/api/client.spec.ts),
[checkout](../../src/features/checkout/checkout.store.spec.ts).

Карта раздела: [архитектура](INDEX.md).

## Граница одной и нескольких цен

Сейчас stores и runtime-валидаторы работают с `/api/v2` и фиксированными
`S/M/L` с `displayLabel`. Принятый в
[ADR-006](../../../docs/20-architecture/ADR/ADR-006-product-variant-portions.md)
целевой контракт ещё не реализован.

Целевой v3 API-слой валидирует одну из двух форм. Одна цена приходит на товаре
как `price` и nullable `portionLabel` с пустым `priceChoices`. Несколько цен
приходят как минимум два упорядоченных choice со стабильными `id`, обязательной
подписью, ценой и ручной доступностью; цена и подпись товара тогда равны null.
Клиент не знает kind, amount, unit, preset или default.

Menu state сохраняет серверный порядок и вычисляет первый доступный choice.
Cart state хранит nullable `priceChoiceId` и показанную подпись: для одной цены
id отсутствует, а для нескольких обязателен. History принимает только
серверный снимок подписи и цены; legacy `S/M/L` остаётся строкой без физической
интерпретации. Это target state: runtime-контракты и проверки ещё должны быть
переключены согласованно.
