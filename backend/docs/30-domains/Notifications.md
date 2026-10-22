---
title: "Push-привязки"
type: domain
owner: backend
last_verified: 2026-10-21
sources:
  - ../../src/notifications/transport/push-subscriptions.controller.ts
  - ../../openapi/openapi.json
  - ../../src/auth/transport/roles.guard.ts
  - ../../src/notifications/application/manage-push-subscription.use-case.ts
  - ../../src/notifications/adapters/postgres-push-subscription.repository.ts
  - ../../src/notifications/application/send-order-push.use-case.ts
knowledge_role: implementation
scope: backend
---

# Push-привязки

Текущий v2 push API содержит public key, inspect и версионируемую association через `PUT` / `DELETE`. Прямые маршруты записи / удаления subscription отсутствуют. Владельцы: [controller](../../src/notifications/transport/push-subscriptions.controller.ts) и [OpenAPI](../../openapi/openapi.json).

## Доступ и владение

Все маршруты требуют действующей Bearer-сессии. Public key не ограничен ролью;
inspect и association `PUT` / `DELETE` доступны только Customer и Barista через
именованную политику `CustomerOrBarista`. Administrator получает отказ;
неизвестная политика тоже отклоняется. Источник проверки —
[RolesGuard](../../src/auth/transport/roles.guard.ts), а роль для выбора
прикладного сценария берётся из доверенного `CurrentAuth`, не из body.

[ManagePushSubscriptionUseCase](../../src/notifications/application/manage-push-subscription.use-case.ts)
владеет одним алгоритмом proof/version. Customer использует `associate`, Barista —
`associateForBarista`. При `enable` expectedVersion должен быть null: создаётся
свободный endpoint либо возвращается версия существующей точной собственной
привязки. Чужой endpoint или несовпадение proof дают `409`. При `transfer` нужны
ненулевая ожидаемая версия и точные endpoint/декодированные ключи; совпавшая
собственная привязка остаётся без изменения версии. Barista получает `409` для
любого чужого владельца. Customer переносит от владельца с текущей ролью
`customer`, проверенной под блокировкой пользователя. SQL записи также проверяет
прежнего владельца, версию и роль. Решение выполняется внутри приведённого ниже
атомарного протокола повторной авторизации.

Inspect возвращает `none` / `current` / `other` и nullable version, без чужого ID
или роли. `DELETE` требует точные собственные endpoint/ключи/версию; отсутствие
привязки даёт `204`, несовпадение — `409`. Валидация HTTPS/ключей/UUID,
HTTP-статусы и error envelope сохраняются; точные схемы принадлежат OpenAPI.

## Получатели нового заказа

[findForStaff](../../src/notifications/adapters/postgres-push-subscription.repository.ts)
выбирает только текущую роль `barista`, без Administrator. Это соответствует
[матрице ролей](../../../docs/10-overview/Roles-and-access.md). Customer-получатели
остаются отдельным выбором по владельцу заказа.
[Создание заказа](../../src/orders/application/create-order.use-case.ts)
начинает best-effort асинхронную отправку после сохранения нового, неповторного
заказа. [Sender use case](../../src/notifications/application/send-order-push.use-case.ts)
сохраняет title/body/orderId и при `404` / `410` удаляет только выбранный
versioned snapshot. Роль проверяется при отдельных чтениях; уже выбранная
отправка может завершиться после logout или смены роли. Гарантированная доставка,
exactly-once и немедленный отзыв отправки не заявлены.

Семантика привязки и удаления при logout принадлежит [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md). Эта серверная граница не подтверждает доставку push в браузер; общий вход — [push-контракт](../../../docs/50-interfaces/Push-notifications.md).

## Отказ от нового заказа

Source-команда отказа из [ADR-012](../../../docs/20-architecture/ADR/ADR-012-back-office-source-contract.md)
после commit отправляет покупателю best-effort сообщение об отказе с сохранённой
причиной. `REJECTED` существует только как тип push-события, не как значение
`order_stage`. Остальные права и владение push остаются прежними.

## Атомарная авторизация association

Исправление G3 повторно проверяет доверенные userId, sessionId и role
из `CurrentAuth` внутри одной транзакции с решением association. Порядок
блокировок: общий membership advisory lock из staff-users → относящиеся
пользователи по возрастанию UUID → текущая сессия → endpoint подписки.
Membership lock сохраняет совместимость с порядком actor/target в
административных командах; refresh блокирует user перед session, logout —
session перед subscription. Чтение владельца для выбора блокируемых
пользователей выполняется после membership lock и повторяется после блокировки
endpoint; изменение или удаление владельца не разрешает захват новой роли.

Перед решением проверяются текущая незаблокированная учётная запись, точная
роль customer/barista, принадлежность сессии, отсутствие отзыва и фактический
срок действия. Проверка собственного идемпотентного успеха находится в той же
транзакции. Передача Customer проверяет текущую роль предыдущего владельца
customer под его блокировкой; Barista не получает чужую связь. Proof, версия,
CAS и уникальность endpoint сохранены. Отсутствующий внутренний контекст
не превращается в разрешение: производственный путь отклоняет его.

Если блокировка/смена роли выигрывает первой, последующая association видит
отказ; если association выигрывает первой, следующая блокировка отзывает
сеансы и удаляет связь. Выбор получателей дополнительно исключает blocked
аккаунты; staff остаётся только barista. Это не отзывает уже выбранную или
отправленную push. Наблюдение конкурентного HTTP-поведения и независимая
security-приёмка принадлежат интеграционному этапу.
