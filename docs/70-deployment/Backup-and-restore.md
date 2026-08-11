---
title: Резервное копирование и восстановление
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../deploy/compose.yml
---

# Резервное копирование и восстановление

PostgreSQL использует именованный Docker volume, но автоматическое резервное
копирование, срок хранения, процедура восстановления и его проверка не
реализованы в текущей поставке.
[Compose volume](../../deploy/compose.yml).

До появления отдельной операции резервное копирование и восстановление остаются
внешней обязанностью оператора PostgreSQL; CI/CD не создаёт backup. [CI/CD](CI-CD.md),
[delivery CI](../../.github/workflows/delivery-ci.yml).
