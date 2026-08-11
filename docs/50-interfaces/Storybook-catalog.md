---
title: Каталог Storybook
type: reference
owner: root
last_verified: 2026-08-11
sources:
  - ../../back-office/.storybook/main.ts
  - ../../front-office/.storybook/main.ts
---

# Каталог Storybook

Каждое клиентское приложение ведёт отдельный Storybook-каталог для согласования
состояний интерфейса до разработки runtime UI. Каталог — вспомогательный
инструмент проектирования; приёмка и CI проверяют runtime приложения.

Back-office и front-office владеют собственными stories и конфигурацией.
[back-office/.storybook/main.ts](../../back-office/.storybook/main.ts),
[front-office/.storybook/main.ts](../../front-office/.storybook/main.ts).
