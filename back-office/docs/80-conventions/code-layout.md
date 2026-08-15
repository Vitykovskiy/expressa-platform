---
title: Размещение кода back-office
type: convention
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../AGENTS.md
  - ../../src/app/router.ts
---

# Размещение кода

Runtime-код располагается по направлению `app -> pages -> widgets -> features -> entities -> shared`. Страница владеет композицией маршрута, widget — самостоятельной оболочкой, shared — техническими и UI-примитивами без предметных зависимостей. Соглашение и запрет импортов из front-office: [AGENTS](../../AGENTS.md).
