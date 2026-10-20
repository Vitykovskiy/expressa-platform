---
title: "Контракты и варианты реализации"
type: convention
owner: root
last_verified: 2026-10-21
sources:
  - ../../AGENTS.md
  - Clean-code.md
knowledge_role: requirements
scope: system
updated: 2026-10-21
---

# Контракты и варианты реализации

Применяется к новому и изменяемому авторскому коду по [общему стандарту](Clean-code.md). Приёмка — [общий DoD](Definition-of-Done.md).

Все примеры ниже учебные; их виртуальные файлы и контракты заданы в тексте, это не API или файлы Expressa.

## Расширение, подстановка и возможности — SOLID-O/L/I

| Принцип                     | Обязательное условие                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O — расширение              | Для существующего семейства вариантов используется его действующий контракт расширения. Проверки нового варианта не распространяются по несвязанным стабильным потребителям. Исправлять дефект или менять согласованный контракт допустимо; `switch` сам по себе не дефект. Strategy, registry и иерархия для гипотетического варианта не создаются. |
| L — подстановка             | Реализации общего явного или подразумеваемого контракта сохраняют допустимые входы, результаты, отсутствие, ошибки, инварианты и обязательные эффекты. Предусловия не усиливаются, постусловия не ослабляются. Потребитель не компенсирует ложное обещание проверкой типа реализации.                                                                |
| I — возможности потребителя | Публичный контракт предоставляет нужную связную возможность. Потребитель не обязан поддерживать несвязанные операции или методы-заглушки с исключением. Связный интерфейс не дробится по числу методов; дополнительные поля DTO сами по себе не дефект.                                                                                              |

Принципы действуют для функций, composables, структурных TypeScript-контрактов
и адаптеров без обязательного наследования или interface для каждого класса.
Если подставляемых реализаций нет, L неприменим; создавать их ради проверки
не нужно. Замкнутое семейство с единым явным владельцем допустимо, когда связь
является частью его контракта.

## Наблюдение при приёмке

Проверьте существующие варианты, допустимые входы, отсутствие, ошибки и эффекты у их потребителей. Если реализации для подстановки нет, L неприменим с этой причиной; остальные применимые принципы сохраняются.

**Пример E04.** В условном экспорте уже нужны текстовый и списочный форматы. Существующий контракт — функция форматирования проверенных названий; два стабильных потребителя готовят preview и download. Виртуальный `title-export.types.ts`:

```typescript
export type TitleFormatter = (titles: readonly string[]) => string;
export type ExportKind = "text" | "list";
```

Антипример `title-export.ts`: оба потребителя знают варианты.

```typescript
import type { ExportKind } from "./title-export.types";

export function preview(titles: readonly string[], kind: ExportKind): string {
  return kind === "text" ? titles.join("\n") : titles.join(", ");
}

export function prepareDownload(
  titles: readonly string[],
  kind: ExportKind,
): string {
  return kind === "text" ? titles.join("\n") : titles.join(", ");
}
```

Исправление использует объявленный контракт в потребителях:

```typescript
import type { TitleFormatter } from "./title-export.types";

export function preview(
  titles: readonly string[],
  format: TitleFormatter,
): string {
  return format(titles);
}

export function prepareDownload(
  titles: readonly string[],
  format: TitleFormatter,
): string {
  return format(titles);
}
```

Виртуальный `title-formatters.ts` — исполняемые функции двух текущих вариантов:

```typescript
export function formatText(titles: readonly string[]): string {
  return titles.join("\n");
}

export function formatList(titles: readonly string[]): string {
  return titles.join(", ");
}
```

Владелец выбора передаёт нужную функцию обоим потребителям; например `preview(titles, formatText)`. Строки, порядок и результат для пустого списка сохранены. При добавлении поддерживаемого формата меняются formatter и место выбора; стабильные потребители не получают новую проверку. Различное поведение preview/download в будущем может потребовать другого контракта, а не нового registry.

**Пример E05.** Условные два reader читают уже проверенные названия. Любой непустой ID допустим; существующее название возвращается без изменений, отсутствующее — `null`, пустой ID вызывает ошибку. `title-reader.types.ts`:

```typescript
export interface TitleReader {
  read(id: string): string | null;
}
```

Антипример `title-readers.ts`: второй reader ложно ограничивает допустимый вход по собственному формату ID. `titles` — переданный `ReadonlyMap<string, string>`.

```typescript
import type { TitleReader } from "./title-reader.types";

export function createRestrictedReader(
  titles: ReadonlyMap<string, string>,
): TitleReader {
  return {
    read: (id) => {
      if (!id.startsWith("local-")) {
        throw new Error("Допустим только локальный ID");
      }
      return titles.get(id) ?? null;
    },
  };
}
```

Исправление: обе реализации используют один и тот же контракт. Виртуальный `title-readers.ts`:

```typescript
import type { TitleReader } from "./title-reader.types";

export function createMapReader(
  titles: ReadonlyMap<string, string>,
): TitleReader {
  return { read: (id) => readTitle(titles, id) };
}

export function createSnapshotReader(
  titles: ReadonlyMap<string, string>,
): TitleReader {
  const snapshot = new Map(titles);
  return { read: (id) => readTitle(snapshot, id) };
}

function readTitle(
  titles: ReadonlyMap<string, string>,
  id: string,
): string | null {
  if (id.length === 0) {
    throw new Error("ID пуст");
  }

  return titles.get(id) ?? null;
}
```

Предполагается неизменность исходной карты на время сравниваемого чтения. Оба reader возвращают одно название или явное отсутствие, не меняют карту и одинаково отклоняют пустой ID. `?? null` здесь точно реализует объявленный контракт отсутствия ключа; это не угадывание внешних данных. Разные lifecycle-контракты snapshot/live требуют отдельного явного обещания. Ошибка антипримера видна для существующего ID без `local-`; компенсация через тип reader в потребителе не нужна.

**Пример E06.** Условный просмотрщик только читает название. Реальный редактор отдельно использует запись. Антипример контракта в `title-capabilities.types.ts` заставляет просмотрщик требовать запись:

```typescript
export interface TitleEditor {
  read(id: string): string | null;
  write(id: string, title: string): void;
}
```

Антипример `title-preview.ts`:

```typescript
import type { TitleEditor } from "./title-capabilities.types";

export function showTitle(source: TitleEditor, id: string): string | null {
  return source.read(id);
}
```

Read-only источник вынужден придумывать `write`, который выбрасывает «не поддерживается».

Исправление в `title-capabilities.types.ts`:

```typescript
export interface TitleLookup {
  read(id: string): string | null;
}

export interface TitleWriter {
  write(id: string, title: string): void;
}
```

Виртуальный `title-preview.ts`:

```typescript
import type { TitleLookup } from "./title-capabilities.types";

export function showTitle(source: TitleLookup, id: string): string | null {
  return source.read(id);
}
```

Просмотр сохраняет результаты, отсутствие и ошибки `read`; мутации не появляются. Редактор продолжает получать `TitleWriter` у реального владельца записи; если ему нужны обе возможности, он получает обе либо связный составной контракт. Разделение исправляет доказанную лишнюю зависимость, а не количество методов.
