---
title: Приоритет источников
description: Порядок разрешения расхождений между требованиями, планированием и реализацией.
type: policy
owner: root
last_verified: 2026-08-11
area: meta
status: current
tags: [expressa, documentation, sources]
updated: 2026-08-01
source_mode: normative
sources:
  - ../_sources/Expressa_MVP_Техническое_задание.md
  - ../10-overview/Backlog.md
  - ../10-overview/Backlog-coverage.md
requirements: [TR-REP-001, TR-REP-002, TR-REP-003]
repositories: [backend, front-office, back-office]
related: ["[[_MOC-meta]]", "[[Coverage-model]]", "[[Update-protocol]]", "[[../20-architecture/ADR/ADR-001-Root-repository-structure]]"]
---

# Приоритет источников

Для требований Expressa нормативен `Expressa_MVP_Техническое_задание.md`. [[../10-overview/Backlog|Бэклог]] — текущий источник планирования, [[../10-overview/Backlog-coverage|покрытие бэклога]] — источник трассируемости; они не изменяют требования ТЗ.

Принятый ADR имеет приоритет над соответствующим архитектурным положением ТЗ. [[../20-architecture/ADR/ADR-001-Root-repository-structure|ADR-001]] заменяет требование отдельных Git-репозиториев правилом единого корневого репозитория с тремя автономно собираемыми приложениями.

- код, OpenAPI, конфигурация и тесты имеют приоритет над текстом документации;
