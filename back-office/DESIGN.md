---
version: alpha
name: Expressa Back-office 2.0
description: Минималистичное основание интерфейса для опытных сотрудников.
colors:
  background: "#F5F6F8"
  surface: "#FFFFFF"
  surface-muted: "#ECEFF3"
  foreground: "#18202B"
  foreground-muted: "#566171"
  border: "#D6DCE4"
  control-border: "#788496"
  primary: "#2156D9"
  primary-hover: "#1947BA"
  primary-pressed: "#153A96"
  on-primary: "#FFFFFF"
  selected: "#E8EFFF"
  on-selected: "#173F9F"
  danger: "#B42332"
  on-danger: "#FFFFFF"
  danger-muted: "#FFF0F1"
  warning: "#805500"
  warning-muted: "#FFF5D6"
  focus: "#2156D9"
typography:
  page-title:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1.5rem
    lineHeight: "1.25"
    fontWeight: 600
    letterSpacing: -0.01em
  section-title:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1.125rem
    lineHeight: "1.35"
    fontWeight: 600
  body:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1rem
    lineHeight: "1.5"
    fontWeight: 400
  label:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 0.875rem
    lineHeight: "1.4"
    fontWeight: 500
  data:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 0.875rem
    lineHeight: "1.45"
    fontWeight: 400
  caption:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 0.75rem
    lineHeight: "1.4"
    fontWeight: 400
rounded:
  control: 0.5rem
  surface: 0.75rem
  badge: 0.5rem
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  xxl: 2rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: 2.75rem
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
  text-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: 2.75rem
  badge:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground-muted}"
    rounded: "{rounded.badge}"
---

## Overview

Expressa Back-office предназначен для бариста и администратора. Его основание
использует спокойные нейтральные поверхности, ясную иерархию действий и
непрерывные рабочие зоны для опытного сотрудника.

## Colors

Используйте синий для действия и выбора, красный для ошибки и опасного действия,
янтарный для предупреждения. Обычные статусы оставляйте нейтральными.
Разделитель обозначает группу; граница control должна сохранять различимость
интерактивного элемента. Передавайте состояние текстом и семантикой control,
а не одним цветом.

## Themes

Используйте одни semantic roles в обеих темах, включая перенесённые меню и
диалоги. Светлые значения заданы в frontmatter; для тёмной темы заменяйте
значения тех же ролей по таблице. При отсутствии сохранённого выбора следуйте
системной теме до явного выбора сотрудника.

| Role             | Light   | Dark    |
| ---------------- | ------- | ------- |
| background       | #F5F6F8 | #15181D |
| surface          | #FFFFFF | #1E232B |
| surface-muted    | #ECEFF3 | #2A313C |
| foreground       | #18202B | #F1F4F8 |
| foreground-muted | #566171 | #ACB6C4 |
| border           | #D6DCE4 | #3D4654 |
| control-border   | #788496 | #7E8A9B |
| primary          | #2156D9 | #91B4FF |
| primary-hover    | #1947BA | #B0C9FF |
| primary-pressed  | #153A96 | #739BEA |
| on-primary       | #FFFFFF | #10244E |
| selected         | #E8EFFF | #283C60 |
| on-selected      | #173F9F | #BCD1FF |
| danger           | #B42332 | #FFADB5 |
| on-danger        | #FFFFFF | #4C111C |
| danger-muted     | #FFF0F1 | #43252C |
| warning          | #805500 | #F0CB7A |
| warning-muted    | #FFF5D6 | #3B3222 |
| focus            | #2156D9 | #91B4FF |

## Typography

Сохраняйте системный шрифт для кириллицы. Отделяйте заголовок страницы от
заголовка рабочей зоны, а подпись control — от редактируемого значения.
Длинные русские подписи, ошибки и текст действий должны переноситься без
перекрытия соседних controls.

## Layout

Группируйте связанные поля и действия непрерывными зонами с разделителями.
На широкой композиции используйте две сжимаемые зоны; на узкой сохраняйте
порядок чтения одной колонкой. Фильтры и действия переносятся, поля занимают
доступную ширину. Контекстные действия размещайте рядом с их содержимым.

## Elevation & Depth

Обычные поверхности разделяйте тоном и границами. Тень оставляйте только
модальному overlay. Уменьшенное движение сохраняет статичную понятную
обратную связь о загрузке.

## Shapes

Сохраняйте общую геометрию controls и мягкое скругление. Высота control —
минимум, а не ограничение для переноса подписи; не обрезайте текст ради
фиксированной высоты.

## Components

Выделяйте одно основное действие в каждой активной рабочей зоне. Вторичные
и тихие действия оставляйте подчинёнными. Опасное действие требует явного
контекста подтверждения. Loading и pending блокируют повторное действие,
сохраняя доступное имя и подтверждённое состояние.

Поле всегда имеет связанную метку; ошибка относится к своему полю или
действию. Ошибка сохранения сохраняет черновик и доступное восстановление.
Диалог получает доступное имя, удерживает клавиатурный фокус и возвращает
его инициатору после разрешённого закрытия. Focus остаётся видимым.

## Do's and Don'ts

- Не добавляйте лишние постоянные информационные сообщения в рабочие зоны.
- Не используйте старый back-office как референс или источник восстанавливаемого UI.
- Не превращайте обычные статусы в декоративные цветовые акценты.
