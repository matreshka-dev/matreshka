# ContextRef Type Naming

Этот документ фиксирует модель именования типов вокруг `ContextRef` в `@matreshka/bff/core`.

Цель — чтобы имя типа сразу отвечало на вопрос: это
- ссылка на путь в контексте,
- извлечение типа значения по ссылке,
- или value-oriented контракт для API, которому не важны `context` и `path`.

## Проблема, которую решает модель

Раньше рядом использовались похожие имена для разных уровней абстракции:
- `ContextRef` как path-aware ссылка;
- типы для извлечения значения по `ContextRef`;
- типы для сигнатур «принимаю любой ref, если у него совместимый тип значения».

Из-за этого на call site было неочевидно, что именно ожидает API: «строгий путь» или «любой ref с нужным value-type».

## Базовые семейства типов

### 1) Path-aware ref

- `ContextRef<ContextType, PathType, SchemaType>` — основной типизированный ref на путь в конкретном контексте.
- Используется, когда нужен доступ к `context`, `path`, типизированный `ref(...)`, `strictRef(...)`.

### 2) Extractor типа значения

- `ContextRefValueType<R extends ContextRef>` — вычисляет тип значения, на которое указывает `R`.
- Это utility-тип, не «форма ref».

Пример:

```ts
type UserName = ContextRefValueType<typeof userNameRef>; // string
```

### 3) Value-oriented ref (без привязки к Context/Path)

- `ContextRefOfValue<ValueType>` — контракт «любой ContextRef, у которого get/set работают с ValueType».
- Используется в API хелперов и компонентов, которым не нужен доступ к path-aware возможностям.

Пример:

```ts
import type { ContextRefOfValue } from "@matreshka/bff/core";

function finishSubmit(loadingRef: ContextRefOfValue<boolean | undefined>) {
  loadingRef.set(false);
}
```

### 4) Совместимость ref по типу значения

- `CompatibleContextRefOfValue<ValueType, R extends ContextRef>` — фильтрует `R`, оставляя только ref с совместимым типом значения.
- Нужен для compile-time проверок в generic-сигнатурах.

Для writable API дополнительно используется:

- `WritableContextRef<R extends ContextRef>` — путь `R` присутствует в writable-paths `schema`;
- `WritableContextRefOfValue<ValueType>` — без generic по ref: writable-принадлежность выражена структурно (`local.set` есть только у writable-путей), `local` выводится из `ContextRef.local` (`ContextRefLocalActions`) для эталонного writable ref, поэтому ref с путём вне writable-путей schema не проходит проверку, а новые методы `local` подхватываются автоматически. Предпочтительный тип для сигнатур хелперов и actions;
- `CompatibleWritableContextRefOfValue<ValueType, R>` — одновременно совместимость по значению и writable-принадлежность пути.

### 5) Union для аргументов API

- `ValueOrContextRef<ValueType>` — значение `ValueType` или `ContextRefOfValue<Exclude<ValueType, undefined>>`.
- Используется в локальных actions (`set/inc/dec`) и подобных API.

### 6) Частный alias для массивов

- `ContextArrayValueRef<ItemType>` — alias для `ContextRefOfValue<ItemType[] | undefined>`.
- Применяется в `forEach`-подобных сценариях, где generic — это тип элемента массива.

## Правила нейминга для новых типов

1. Если тип **вычисляет** значение по `ContextRef`, использовать суффикс `ValueType`.
2. Если тип описывает **сам ref-контракт по типу значения**, использовать `RefOfValue`.
3. Если тип — это union «literal или ref», использовать префикс `ValueOr...`.
4. Если тип проверяет совместимость в generic, начинать с `Compatible...`.
5. Если это специализированный alias (`array`, `number`, `boolean`), оставлять базовую семантику в имени (`...ValueRef`, `...RefOfValue`) и уточнять домен суффиксом/префиксом.

## Как выбирать тип на практике

- Нужны `path`, `context`, `ref("nested.path")`:
  - использовать `ContextRef<...>`.
- Нужен только контракт значения для внешнего хелпера:
  - использовать `ContextRefOfValue<T>`.
- Нужен вывод типа из уже имеющегося ref:
  - использовать `ContextRefValueType<typeof ref>`.
- Нужно принять literal или ссылку:
  - использовать `ValueOrContextRef<T>`.
- Нужен ref на массив элементов:
  - использовать `ContextArrayValueRef<Item>`.

- Нужен ref для input/local actions, где путь обязан быть в `schema`:
  - использовать writable-совместимые контракты (`CompatibleWritableContextRefOfValue` и производные типы компонентов/actions).

## Граница ответственности

Эта модель описывает только naming и intent типов. Она не меняет runtime-поведение `ContextRef`, `Context`, условий или действий.
