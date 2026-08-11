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

| Владелец | Переходы и граница | Источник |
|---|---|---|
| `session` | `unknown` восстанавливается через refresh; customer-токен и `/me` дают `authenticated`; logout очищает сессию и корзину | [store](../../src/app/session.store.ts) |
| `menu` | `idle/loading/ready/error`; параллельная загрузка объединяется, ready не загружается повторно | [store](../../src/entities/customer/model/menu.store.ts) |
| `cart` | конфигурации с одинаковыми товаром, вариантом и опциями объединяются; localStorage восстанавливается только после проверки формы | [store](../../src/entities/customer/model/cart.store.ts) |
| `checkout` | submit блокирует повтор; успех хранит заказ; network можно повторить, изменение суммы требует подтверждения | [store](../../src/features/checkout/checkout.store.ts) |

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
optional request id и по «Закрыть» очищает store. `mapApiErrorToScreenError` есть
и тестируется, но runtime consumer не найден: он не создаёт этот поток.
[Источники: App](../../src/app/App.vue), [store](../../src/app/app.store.ts),
[mapper](../../src/app/api-error.mapper.ts), [notice](../../src/shared/ui/ErrorNotice.vue).

В production регистрируется service worker; development его не регистрирует.
[Источник: PWA](../../src/app/pwa.ts).

Проверки: [session](../../src/app/session.store.spec.ts), [API](../../src/shared/api),
[checkout](../../src/features/checkout/checkout.store.spec.ts).
