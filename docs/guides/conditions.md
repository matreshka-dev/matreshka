# Conditions

Условия управляют тем, что видит и получает пользователь: показать компонент, переопределить его свойства или выполнить действие. Клиент проверяет условия по текущим данным `Context` и типу устройства.

```ts
import { when, device } from "@matreshka/bff/core/conditions";
```

- `when` — условия по данным в контексте (значения и массивы);
- `device` — условия по типу устройства.

## Быстрый старт

```ts
stack(
  {
    conditions: [
      when.equals(this.context.ref("language"), "ru"),
      when.notEmpty(this.context.ref("items")),
      device.notMobile(),
    ],
  },
  [text("Показывается на русском, когда есть товары, и не на телефоне")],
);
```

## Где применяются

| Место | Что решают |
| --- | --- |
| `conditions` у компонента | Показывать компонент или нет |
| `rules[].conditions` | Применять ли переопределения свойств (`overrides`) |
| `conditions` у действия | Выполнять ли действие на **клиенте** после события (local action или отправка interaction) |

Проверка conditions для действий выполняется только на клиенте; BFF не повторяет их перед `ServerAction`. См. [События и действия](events-and-actions.md) и скилл `server-action-validate-in-handler`.

Несколько условий в списке объединяются по **И** — компонент показывается (или действие выполняется), только когда выполнены все.

Для **ИЛИ** и вложенных групп используйте `when.any()` и `when.all()` — см. раздел [Группы условий (AND / OR)](#группы-условий-and--or).

## Значение для сравнения

Там, где условие что-то сравнивает, вторым аргументом можно передать:

- **литерал** — `string`, `number`, `boolean` или `null` (тип должен совпадать с типом поля в контексте);
- **ссылку на контекст** — `context.ref("...")`, тогда значение берётся из контекста в момент проверки.

```ts
// с литералом
when.equals(this.context.ref("status"), "active");

// со значением из другого контекста
when.equals(this.context.ref("selectedId"), filters.ref("currentId"));
```

## Условия по значению (`when`)

| Условие | Проверяет |
| --- | --- |
| `when.equals(ref, value)` | значение равно `value` |
| `when.notEquals(ref, value)` | значение не равно `value` |
| `when.oneOf(ref, [a, b, ...])` | значение входит в список |
| `when.defined(ref)` | значение задано |
| `when.notDefined(ref)` | значение не задано |

```ts
when.oneOf(this.context.ref("status"), ["active", "pending"]);
when.defined(this.context.ref("name"));
```

## Условия по массиву (`when`)

| Условие | Проверяет |
| --- | --- |
| `when.isEmpty(ref)` | массив пустой |
| `when.notEmpty(ref)` | в массиве есть элементы |
| `when.lengthEquals(ref, n)` | длина равна `n` |
| `when.lengthLessThan(ref, n)` | длина меньше `n` |
| `when.lengthAtMost(ref, n)` | длина не больше `n` |
| `when.lengthGreaterThan(ref, n)` | длина больше `n` |
| `when.lengthAtLeast(ref, n)` | длина не меньше `n` |
| `when.includes(ref, itemPath, value)` | в массиве есть элемент, у которого поле `itemPath` равно `value` |
| `when.excludes(ref, itemPath, value)` | в массиве нет такого элемента |

Про `includes` / `excludes`:

- `ref` — ссылка на массив;
- `itemPath` — путь к полю внутри элемента (через `.`); пустая строка `""` сравнивает сам элемент (для массивов примитивов);
- `value` — литерал или ссылка на контекст.

```ts
when.notEmpty(this.context.ref("items"));

// показать «убрать из корзины», если оффер уже в корзине
when.includes(user.ref("cart"), "offerId", offer.ref("id"));
```

## Условия по устройству (`device`)

Аргументов нет — зависят только от устройства клиента.

| Условие | Когда истинно |
| --- | --- |
| `device.mobile()` | телефон |
| `device.tablet()` | планшет |
| `device.desktop()` | десктоп |
| `device.notMobile()` | не телефон |
| `device.notTablet()` | не планшет |
| `device.notDesktop()` | не десктоп |

```ts
stack(
  { conditions: [device.notMobile()] },
  [text("Только не на телефоне")],
);
```

## Группы условий (AND / OR)

Плоский список `conditions: [A, B, C]` означает **A AND B AND C**.

Для OR и вложенных комбинаций есть составные условия:

| Хелпер | Смысл |
| --- | --- |
| `when.any([...])` | хотя бы одно из условий (OR) |
| `when.all([...])` | все условия (AND) — явная группа, удобна внутри `any` |

### OR между разными предикатами

`when.any` нужен, когда OR идёт между **разными** проверками — разные поля, массивы, устройство.  
Если OR только по одному полю и списку литералов, используйте `when.oneOf(ref, [...])`.

```ts
stack(
  {
    conditions: [
      when.any([
        when.equals(this.context.ref("role"), "admin"),
        when.equals(permissions.ref("canModerate"), true),
      ]),
    ],
  },
  [text("Панель модерации")],
);
```

Смысл: пользователь **admin** **OR** у него явно включено право `canModerate`.

### Одна из двух групп

```ts
button(
  {
    conditions: [
      when.any([
        when.all([
          when.equals(filters.ref("format"), "csv"),
          when.notEmpty(table.ref("rows")),
        ]),
        when.all([
          when.equals(filters.ref("format"), "pdf"),
          when.defined(templates.ref("selectedId")),
        ]),
      ]),
    ],
    onClick: () => this.export(),
  },
  [text("Экспорт")],
);
```

Смысл: (**csv** AND **есть строки**) **OR** (**pdf** AND **выбран шаблон**).

### OR + общее ограничение снаружи

```ts
stack(
  {
    conditions: [
      when.any([device.desktop(), device.tablet()]),
      when.defined(session.ref("userId")),
    ],
  },
  [text("Расширенный UI")],
);
```

Верхний уровень остаётся AND: (desktop **OR** tablet) **AND** userId задан.

## Что читать дальше

**Следующий обязательный шаг:** [Основы компонентов](components-basics.md) — как
`conditions` работают вместе с `rules` и общей моделью компонентов.
