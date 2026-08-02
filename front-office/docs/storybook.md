---
title: Storybook front-office
description: Текущее устройство перенесённого Customer Storybook.
type: guide
area: front-office
status: current
tags: [front-office, storybook, vue, ui]
updated: 2026-08-03
---

# Storybook front-office

Customer Storybook перенесён из эталонного проекта без изменения runtime UI и
дизайн-системы. Экраны находятся в [`src/customer/pages`](../src/customer/pages),
UI-примитивы и модели — в [`src/customer/shared`](../src/customer/shared),
оболочка — в [`src/customer/shell`](../src/customer/shell), а истории и fixtures —
в [`src/stories/customer`](../src/stories/customer). Истории импортируют runtime
UI; runtime-код не зависит от Storybook.

Design tokens определены в
[`customer-tokens.css`](../src/styles/customer-tokens.css), глобальные стили — в
[`main.css`](../src/styles/main.css), тема Vuetify — в
[`vuetify.ts`](../src/plugins/vuetify.ts). Каталог содержит 146 записей, включая
123 stories; его точное соответствие эталону проверяет
[`check-storybook-manifest.mjs`](../scripts/check-storybook-manifest.mjs).

Проверки и команды находятся в [`package.json`](../package.json). Визуальные
эталоны хранятся рядом с
[`visual.spec.mjs`](../scripts/visual.spec.mjs); интерактивная проверка запускает
каждую эталонную story в Chromium. Автоматическая accessibility-проверка
покрывает семантику в границе
[`UI-accessibility`](../../docs/40-quality/UI-accessibility.md); правила Axe для
контраста и landmarks не подменяют визуально согласованный эталон и исключены
из этого gate.
