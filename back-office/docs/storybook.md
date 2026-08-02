---
title: Storybook back-office
description: Текущее устройство перенесённого Admin Storybook.
type: guide
area: back-office
status: current
tags: [back-office, storybook, vue, ui]
updated: 2026-08-03
---

# Storybook back-office

Admin Storybook перенесён из эталонного проекта без изменения runtime UI и
дизайн-системы. Экраны находятся в [`src/admin/pages`](../src/admin/pages),
общие UI-примитивы — в [`src/admin/shared/ui`](../src/admin/shared/ui), оболочка —
в [`src/admin/shell`](../src/admin/shell), а истории — в
[`src/stories/admin`](../src/stories/admin). Истории импортируют runtime UI;
runtime-код не зависит от Storybook.

Design tokens и тема определены в [`theme.ts`](../src/styles/theme.ts),
глобальные стили — в [`main.css`](../src/styles/main.css), адаптер Vuetify — в
[`vuetify.ts`](../src/plugins/vuetify.ts). Каталог содержит 66 stories; его
точное соответствие эталону проверяет
[`check-storybook-manifest.mjs`](../tests/e2e/check-storybook-manifest.mjs).

Проверки и команды находятся в [`package.json`](../package.json). Визуальные,
интерактивные и accessibility-тесты находятся в [`tests/e2e`](../tests/e2e).
Accessibility-тесты покрывают семантику в границе
[`UI-accessibility`](../../docs/40-quality/UI-accessibility.md); правила Axe для
контраста, landmarks и заголовка страницы не подменяют визуально согласованный
эталон и исключены из этого gate.
