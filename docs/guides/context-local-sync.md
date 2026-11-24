# `sync` в local-действиях Context

Кратко: что делает опция `sync` у `context.local.*` / `ref.local.*`, и когда
ставить `{ sync: false }`.

Базовый API Context — [Context](context.md). Local actions и события —
[События и действия](events-and-actions.md). Zod-схема клиентских ключей —
[Валидация Context](context-validation.md).

## Контекст

Локальные действия записи в Context (`context.local.set` / `toggle` / `inc` /
`dec` и те же методы на `ref.local`) обновляют **клиентское зеркало** сразу,
без ожидания `server-interaction`.

По умолчанию после этого клиент ещё и **синхронизирует** изменение с BFF:
отправляет сообщение `context-values`. На сервере входящий patch проходит
Zod-`schema` контекста.

Опция `sync` управляет именно этой второй частью — уйдёт ли значение на сервер.

`sync` есть только у local-записи Context. У обычного `ActionConfig` (например
у анимации или clipboard) такого поля нет.

## Два режима

|                                                                              | По умолчанию (`sync` не указан или `true`) | `{ sync: false }` |
| ---------------------------------------------------------------------------- | ------------------------------------------ | ----------------- |
| Клиентское зеркало                                                           | Обновляется сразу                          | Обновляется сразу |
| Сообщение `context-values` на BFF                                            | Да                                         | Нет               |
| Ключ в Zod `schema`                                                          | Обязателен                                 | Не нужен          |
| Сервер может писать тот же ключ (`ref.set` / `context.set`) и пушить клиенту | Да                                         | Да                |

Важная асимметрия: `{ sync: false }` означает «клиент **не шлёт** значение на
сервер», а не «ключ запрещён серверу». BFF по-прежнему может обновить поле и
доставить новое значение клиенту.

## Когда оставлять sync по умолчанию

Серверу **нужно** знать или валидировать значение с клиента:

- поля форм и input'ы (они и так идут через `context-values`);
- фильтры, черновики, счётчики, которые читает server handler;
- любое состояние, от которого зависит серверная логика.

Тогда путь должен быть в `schema`, а local-вызов — без `{ sync: false }`.

```ts
button(
  {
    onClick: this.context.local.inc("quantity"),
  },
  [text("+1")],
);

button(
  {
    onClick: this.context.local.set({ dirty: true }),
  },
  [text("Пометить")],
);
```

Без флага TypeScript не даст писать путь вне схемы: writable API требует, чтобы
sync-on путь был описан в `schema`.

## Когда нужен `{ sync: false }`

Критерий: **серверу неважно текущее клиентское значение**.

Типичные случаи:

1. **Ephemeral UI** — hover, подсветка пункта меню, локальный highlight. Иначе
   каждый `mouseenter` / `mouseleave` будет спамить `context-values`.
2. **Клиентский lock формы (`loading`)** — сразу блокирует повторный submit на
   клиенте; сервер сам сбрасывает флаг в handler через `ref.set(false)`.

С `{ sync: false }`:

- пишется только зеркало;
- `context-values` не уходит;
- ключ **не** добавляют в `schema`;
- сервер при необходимости сбрасывает/обновляет поле через `set`.

### Hover

```ts
stack(
  {
    onMouseEnter: this.context.local.set(
      { hoveredMenuItem: "accruals" },
      { sync: false },
    ),
    onMouseLeave: this.context.ref("hoveredMenuItem").local.set(null, {
      sync: false,
    }),
  },
  [text("Меню")],
);
```

`hoveredMenuItem` в `schema` не описывают.

### Loading при submit

```ts
const loadingRef = this.context.ref("loading");

const submitForm = [
  loadingRef.local.set(true, { sync: false }),
  new ServerAction(
    async () => {
      try {
        await submit();
      } finally {
        loadingRef.set(false);
      }
    },
    { conditions: [when.equals(loadingRef, false)] },
  ),
];
```

Клиент ставит `loading: true` только у себя. Сервер не читает этот `true` из
`context-values` — он разблокирует форму сам через `loadingRef.set(false)`.
Ключ `loading` в `schema` не включают.

## Связь со схемой

`schema` у Context отвечает на вопрос: **какие ключи клиент может прислать на
BFF** сообщением `context-values`, и какого они типа.

В схему кладите ключ, только если клиент реально отправляет его на сервер:

- input (`textInput`, `textarea` и т.п.);
- `context.local.*` / `ref.local.*` **без** `{ sync: false }` — значение уходит
  на BFF, значит путь должен быть в `schema`.

В схему **не** кладите ключ, если на BFF с клиента он не приходит:

- запись только через `local.*` с `{ sync: false }` (hover, form `loading`);
- ключ пишет только сервер (`data()`, `context.set`, `ref.set`, `replace`).

Не добавляйте client-only ключи в схему «на всякий случай»: попав в `schema`,
ключ становится доступен для подделки через входящее `context-values`.

## Антипаттерны

```ts
// ❌ Hover с sync по умолчанию — лишний трафик на каждый hover
onMouseEnter: this.context.local.set({ hovered: true });

// ❌ Client-only loading в schema + sync по умолчанию
schema: z.object({
  login: z.string(),
  loading: z.boolean(), // не нужно
});
loadingRef.local.set(true); // без { sync: false }
```

```ts
// ✅ Client-only UI
onMouseEnter: this.context.local.set({ hovered: true }, { sync: false });

// ✅ Loading lock
loadingRef.local.set(true, { sync: false });
// в finally на BFF:
loadingRef.set(false);
```

## Чеклист

1. Серверу нужно текущее значение с клиента? → sync по умолчанию + ключ в
   `schema`.
2. Серверу значение не нужно (UI-флаг, hover, form lock)? → `{ sync: false }`,
   ключ **вне** schema.
3. Нужно ли серверу потом менять это поле? → можно: `ref.set` / `context.set`
   работают и для ключей вне schema.
4. Частые события (hover, mousemove-подобное)? → почти всегда `{ sync: false }`.

## Что читать дальше

- [Context](context.md) — `schema`, local writable API;
- [События и действия](events-and-actions.md) — `LocalAction` и формы;
- [Валидация Context](context-validation.md) — Zod на границе клиента;
- [Cookbook](../recipes/cookbook.md) — hover и запись в Context на клиенте;
- Agent skill `context-local-sync-false` — [Agent skills](../ai/agent-skills.md).
