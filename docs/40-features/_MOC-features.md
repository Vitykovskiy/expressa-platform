---
title: "Сквозные пользовательские пути"
type: moc
owner: root
last_verified: 2026-10-07
sources:
  - ../../front-office/src/app/router.ts
knowledge_role: navigation
scope: system
---

# Сквозные пользовательские пути

Локальная карта — [INDEX.md](INDEX.md). Для сквозного сценария соедините источники обоих акторов:

1. Покупатель: [меню и корзина](Browse-menu-and-build-cart.md), затем [вход и оформление](Authenticate-and-place-order.md).
2. Сотрудник: [приготовление и выдача](Prepare-and-hand-off-order.md).
3. Покупатель: [текущий заказ, история и повтор](Track-history-and-repeat-order.md).

Изменение каталога или продаж связывает [управление меню](Manage-menu.md) и [доступность](Manage-availability.md) с повторной проверкой checkout. Ноты сценариев и их исходники определяют фактическое состояние; эта карта его не дублирует.
