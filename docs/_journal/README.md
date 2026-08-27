---
title: Журнал документации
description: Назначение журнала существенных изменений базы знаний Expressa.
type: journal
area: journal
status: current
tags: [expressa, documentation, journal]
updated: 2026-07-26
source_mode: normative
sources: [Expressa_MVP_Техническое_задание.md]
requirements: [TR-REP-001, TR-REP-002, TR-REP-003]
repositories: [backend, front-office, back-office]
related: ["[../00-meta/Update-protocol](../00-meta/Update-protocol.md)", "[../README](../README.md)"]
---

# Журнал документации

Журнал хранит записи о существенных переходах и миграциях документации. Он
помогает понять происхождение решения, но не заменяет актуальные контракты и
правила из [карты документации](../INDEX.md).

## Структура каталога

```text
_journal/
└── README.md         # назначение и правила добавления исторических записей
```

## Ведение журнала

Новая запись нужна только когда без неё нельзя понять текущий переход или
миграцию. Правила синхронного обновления документации задаёт
[протокол обновления](../00-meta/Update-protocol.md).
