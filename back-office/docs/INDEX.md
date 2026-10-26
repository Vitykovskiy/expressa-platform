---
title: "Документация back-office"
type: index
owner: back-office
knowledge_role: navigation
scope: back-office
---

# Документация back-office

Вход и команды — в [README](../README.md). Общие правила — в
[AGENTS](../../AGENTS.md) и [индексе требований](../../docs/80-conventions/INDEX.md).

- [Покрытие runtime](COVERAGE.md) — текущие потребители и явные N/A.
- [Архитектура](10-architecture/INDEX.md) — владельцы состояния и нативная установка.
- [Владельцы UI и состояния](10-architecture/ui-ownership.md) — оболочка, разделы, команды и сброс идентичности.
- [Размещение кода](80-conventions/code-layout.md) — предметные модули, layout и пути первого чтения.
- [HTTP и уведомления](10-architecture/staff-read-slice.md) — точные API-потребители и native lifecycle.
- [Нативная установка](10-architecture/pwa-installation.md) — manifest, исходные иконки и границы наблюдаемого запуска.
- [Контракт сотрудника](../../docs/50-interfaces/Back-office-UI.md) — требования к полному продукту.
- [Аутентификация](../../docs/50-interfaces/Authentication-API.md) — серверный контракт.
- [Проверка UI](../../docs/40-quality/Validation-strategy.md) — необходимые доказательства и границы приёмки.
