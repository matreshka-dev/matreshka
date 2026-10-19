# Порядок overlays в DOM и tab order

Как клиент matreshka выстраивает siblings оверлеев относительно основного содержимого, чтобы фокус по Tab шёл предсказуемо без ручной настройки на BFF.

См. также [`../guides/overlays.md`](../guides/overlays.md) — API якорей для авторов конфигов.

## Проблема

Overlay позиционируется через CSS (`position: absolute` / `fixed`, классы `component-overlay-anchor-*`). Визуальное место на экране **не совпадает** с порядком узлов среди siblings.

Браузер по умолчанию обходит фокусируемые элементы в **порядке DOM** (если не задан `tabindex`). Если все оверлеи рендерятся после `<ng-content>`, Tab сначала проходит основной контент страницы, хотя сверху уже видны header, badge или панель — и только потом попадает в верхние оверлеи. Для нижних FAB и footer-bar порядок случайно совпадал, для верхних — нет.

Требование: автор BFF задаёт только `anchors` и `component`; **tab order не настраивает** (нет поля «порядок в DOM», нет обязательного `tabindex` в прикладных конфигах).

## Решение

Компонент `app-overlays` (`OverlaysComponent`) оборачивает основной контент host-а и делит массив `overlays[]` на две группы:

```text
[ overlaysBeforeContent ]
<ng-content>  — основное содержимое
[ overlaysAfterContent ]
```

Правила вычисляются на клиенте из тех же `OverlayAnchor`, что используются для CSS. Источник истины в коде: [`overlay-dom-order.ts`](../../client/src/app/components/local/overlays/overlay-dom-order.ts).

`app-overlays` подключён везде, где есть overlays entry-уровня или контейнера: `Page`, `Dialog`, `Popover`, wrapper обычных компонентов с `properties.overlays`, платформенный слой в `app.component`.

## Связь с a11y

- **Обычный сценарий** — естественный порядок фокуса: сначала элементы «выше / ближе к началу» (top, start), затем тело, затем «ниже / ближе к концу» (bottom, end).
- **Исключения** (focus trap в модалке, skip links, programmatic focus) — отдельные механизмы UI; они не заменяют базовый порядок siblings и не требуют менять массив `overlays` на BFF.

## Алгоритм

### Группа: до или после контента

Один overlay попадает ровно в одну группу. При **конфликте осей** (например `Top + End`) побеждает **вертикаль** — иначе нельзя однозначно выбрать одну группу.

| Условие (флаги якорей, см. `overlayAnchorFlags`) | DOM |
| --- | --- |
| `top === true` (в т.ч. `top + bottom`, полная оболочка) | **до** |
| `bottom === true` и `top === false` (в т.ч. `middle + bottom`) | **после** |
| только `middle` по вертикали (нет `top` / `bottom`) | **до** |
| нет вертикальных якорей (`top`, `bottom`, `middle` все false): только горизонталь | `end` без `start` → **после**; иначе → **до** |

Примеры:

- FAB `Bottom + Center` → после контента
- Header `Top + Start + End` → до
- Footer `Bottom + Start + End` → после
- Badge `Top + End` → до (вертикаль важнее)
- Frame `Top + Bottom + Start + End` → до (из‑за `top`)

### Сортировка внутри группы

При равном ключе сохраняется **исходный индекс** в массиве `overlays()` (стабильная сортировка).

**До контента:**

1. Вертикаль: `top` → `middle` (без `top`) → прочее
2. Inline: `start` (без `end`) → `start+end` / `center` → `end` (без `start`)

**После контента:**

1. Inline: как выше
2. Tie-breaker: исходный индекс

## Что не меняется

- CSS-позиционирование и z-index оверлеев — как раньше.
- Порядок элементов в массиве `overlays()` на BFF по-прежнему влияет на tie-break при одинаковых якорях; менять массив ради tab order не нужно.

## Где смотреть в коде

| Файл | Роль |
| --- | --- |
| [`overlay-dom-order.ts`](../../client/src/app/components/local/overlays/overlay-dom-order.ts) | bucket, сортировка, флаги якорей |
| [`overlays.component.ts`](../../client/src/app/components/local/overlays/overlays.component.ts) | `overlaysBeforeContent` / `overlaysAfterContent` |
| [`overlays.component.html`](../../client/src/app/components/local/overlays/overlays.component.html) | два прохода + `ng-content` |
| [`_overlay-components.scss`](../../client/src/scss/_overlay-components.scss) | визуальные якоря |
