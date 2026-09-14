---
title: Выпуск и совместимость версий
type: operations
owner: root
last_verified: 2026-09-14
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../deploy/deploy.sh
---

# Выпуск и совместимость версий

Поддерживается development-поставка текущего `main`. Она поставляет совместный
набор backend, front-office и back-office, пересоздаёт development-базу и
заполняет её каноничным seed. Состояние базы не является входом совместимости.

Теги staging, production-поставка и сохранение данных не поддерживаются до
отдельного решения о постоянных средах.
