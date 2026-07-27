---
title: Приоритет источников
description: Порядок разрешения расхождений между требованиями, планированием и реализацией.
type: policy
area: meta
status: current
tags: [expressa, documentation, sources]
updated: 2026-07-27
source_mode: normative
sources: [Expressa_MVP_Техническое_задание.md, Backlog.md, Backlog-coverage.md]
requirements: [TR-REP-001, TR-REP-002, TR-REP-003]
repositories: [backend, front-office, back-office]
related: ["[[_MOC-meta]]", "[[Coverage-model]]", "[[Update-protocol]]"]
---

# Приоритет источников

Для требований Expressa нормативен `Expressa_MVP_Техническое_задание.md`. [[../10-overview/Backlog|Бэклог]] — текущий источник планирования, [[../10-overview/Backlog-coverage|покрытие бэклога]] — источник трассируемости; они не изменяют требования ТЗ.

- код, OpenAPI, конфигурация и тесты имеют приоритет над текстом документации;
