---
title: "Размещение кода back-office"
type: convention
owner: back-office
knowledge_role: implementation
scope: back-office
last_verified: 2026-10-21
sources:
  - ../../src/main.ts
  - ../../../docs/80-conventions/Code-Definition-of-Done-back-office.md
  - ../10-architecture/ui-ownership.md
---

# Размещение кода back-office

Нормативный владелец структуры — [технический DoD](../../../docs/80-conventions/Code-Definition-of-Done-back-office.md).
Направление зависимостей: `app -> pages -> widgets -> features -> entities -> shared`.
Пустые слои ради схемы не создаются. `widgets/staff` содержит source-навигацию
пяти разделов Administrator и двух разделов Barista. `app` соединяет настоящие
контейнеры и общий сброс идентичности; бизнес-команды принадлежат доменным
владельцам, а не оболочке.

`pages` собирают auth, orders, availability, catalog, users и settings.
`features` владеют вводом, редактированием и действиями; `entities` — DTO,
HTTP, подтверждёнными данными и командами. Notifications feature использует
нативную browser-границу в entities; worker расположен в public и не импортирует
app. `shared` содержит транспорт и source UI-примитивы без предметного состояния.
Подробные границы — в [описании владельцев](../10-architecture/ui-ownership.md)
и [HTTP-ноте](../10-architecture/staff-read-slice.md).

Именованные типы размещаются в соседних `*.types.ts`, константы уровня модуля —
в `*.constants.ts` по DoD. Импорты исходников, конфигурации и типов других
приложений запрещены. Текущая реализация не добавляет общий межконтурный пакет.
