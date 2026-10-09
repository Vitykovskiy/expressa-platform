---
title: "Приготовление и выдача заказа"
type: feature
owner: root
last_verified: 2026-10-09
sources:
  - ../50-interfaces/Back-office-UI.md
  - ../30-domain/Order-lifecycle.md
  - ../30-domain/Order-snapshots.md
knowledge_role: requirements
scope: system
---

# Приготовление и выдача заказа

Сотрудник находит заказ, видит сохранённый состав, сумму и историю, затем
выполняет допустимое следующее действие. Последовательность CREATED,
ACCEPTED, PREPARING, READY, ISSUED принадлежит
[жизненному циклу](../30-domain/Order-lifecycle.md).
[Снимок заказа](../30-domain/Order-snapshots.md) не подменяется текущим меню.

Оплата выполняется на кассе при получении; выдача переводит READY в ISSUED.
При неизвестном результате перехода клиент проверяет текущее серверное
состояние и не повторяет изменение автоматически. Сбой чтения сохраняет
доступную информацию и предоставляет понятное действие восстановления.

[Контракт UI](../50-interfaces/Back-office-UI.md) и
[API](../50-interfaces/Back-office-API.md) определяют результат и обмен.
Сценарий не требует прежней карточки, панели, маршрута или компонента:
новая композиция выбирается по [ADR-011](../20-architecture/ADR/ADR-011-back-office-clean-slate.md).
