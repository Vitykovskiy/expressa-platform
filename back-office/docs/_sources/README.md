---
title: Источники back-office
type: source-index
owner: back-office
last_verified: 2026-08-11
sources:
  - ../INDEX.md
---

# Внешние источники

Каталог предназначен для проверяемых внешних материалов и снимков без секретов.
Он не описывает текущее поведение приложения и сейчас не содержит материалов.

## Структура каталога

```text
_sources/
└── README.md          # статус и граница служебных материалов
```

Текущий локальный снимок HTTP-контракта находится в
[contracts/openapi.json](../../contracts/openapi.json); его соответствие
backend проверяет `npm run contract:check`.
