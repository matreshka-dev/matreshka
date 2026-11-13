# `itemList` — динамические nested-элементы

`itemList` — BFF-примитив для **динамических** дочерних элементов в slot'ах `map.markers` и `board.items`. Это не компонент и не попадает в client tree: на wire клиент всегда получает **плоский** массив элементов с полем `id`.

## Когда использовать

| Сценарий | Примитив |
| -------- | -------- |
| Список однотипных UI-блоков (`forEach`) | `forEach` |
| Маркеры карты / карточки доски из контекста | `itemList` |
| Статический набор markers/items | обычный массив в конфиге |

## Контракт slot'а (hybrid-массив)

```ts
import { map, itemList } from "@matreshka/bff/components";
import { board } from "@matreshka/bff/components";

map({
  apiKey: "...",
  center: { latitude: 55.75, longitude: 37.62 },
  markers: [
    {
      coordinates: { latitude: 55.75, longitude: 37.62 },
      width: 120,
      component: staticMarker,
    },
    itemList({
      ref: context.ref("points"),
      track: (point) => point.id,
      preload: true,
      generator: ({ ref }) => ({
        coordinates: { latitude: ref.get().lat, longitude: ref.get().lng },
        width: 80,
        component: text(ref.get().title),
      }),
    }),
  ],
});

board({
  items: [
    { position: { x: 0, y: 0 }, component: cardA },
    itemList({
      ref: context.ref("departments"),
      track: (d) => d.id,
      generator: ({ ref }) => ({
        position: { x: ref.get().x, y: ref.get().y },
        component: text(ref.get().name),
      }),
    }),
  ],
});
```

**Hybrid-массив** `(StaticItem | ItemList)[]` существует только при авторинге на BFF. Перед отправкой клиенту он **разворачивается** (`flattenNestedItems`) в один плоский массив.

## Wire-format

Каждый элемент на клиенте:

```ts
type NestedItemBase = {
  id: string;
  component: ServerComponentConfig;
};
```

- **Static:** `id = component.id` (должен быть уникален в slot'е).
- **Dynamic (itemList):** `id = track(item)` — стабильный ключ из данных контекста.

Первый ответ страницы по-прежнему содержит полный flat-массив слота. Дальше host шлёт `NestedItemsSyncMessage` с полным порядком id и конфигами только тех id, которых у этого instance клиента ещё нет:

```ts
{
  slot: "markers" | "items";
  order: string[];
  upserts: NestedItemBase[];
}
```

Догрузка и замена одного элемента не повторяют уже отданные конфиги. Полная смена массива присылает только новый набор: старые элементы в сообщение не входят, клиент снимает id, которых нет в `order`. Статические соседи слота сериализуются один раз и дальше только упоминаются в `order`.

## API `itemList`

```ts
itemList<TItem>({
  ref,           // ContextRef на массив данных
  track,         // (item) => string — stable id
  preload?: boolean, // включить в первый ответ страницы (как у forEach)
  generator: ({ ref, itemList }) => TItem,
});
```

- `generator` возвращает `{ component, ...layout }` — для map это `coordinates`, `width`, `anchor`; для board — `position`.
- `ref` в generator — ссылка на элемент массива (с индексом), как в `forEach`.
- `preload: true` — элементы сегмента сериализуются уже в preload-ответе (если контекст инициализирован).

## Отличие от `forEach`

| | `forEach` | `itemList` |
| --- | --- | --- |
| Результат | `StandaloneComponent` в дереве | nested-item внутри map/board |
| Slot | `content` компонента | `markers` / `items` |
| Wire | `ForEachSyncComponentsMessage` | `NestedItemsSyncMessage` |
| Layout | нет (только component) | coordinates / position обязательны |
| Divider | да | нет |

## Ограничения

- `itemList` внутри `itemList` — не поддерживается.
- Static `id` = `component.id` — уникальность в пределах slot'а на авторе.

## См. также

- `components-list.md` — секции `map` / `board`
- `context.md` — ref, `get` / `set`, подписка через `watch()`
