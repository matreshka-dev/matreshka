# Overlays

`Overlays` в matreshka — это механизм размещения компонента поверх другого визуального слоя. Это отдельная концепция, потому что overlays встречаются сразу в нескольких местах:

- у обычных компонентов, например у `stack`;
- у `entry`-компонентов, таких как `Page`, `Dialog`, `Popover`;
- у `clientPlatform` через `setOverlays()`.

Из-за этого overlays лучше воспринимать не как частную настройку одного компонента, а как общий способ наложить один UI-элемент поверх другого контекста отображения.

## Базовая форма overlay

На уровне типов overlay выглядит так:

```ts
type Overlay<TComponent> = {
  anchors: [OverlayAnchor, ...OverlayAnchor[]];
  component: TComponent;
};
```

То есть у overlay всегда есть:

- `anchors` — якоря позиционирования;
- `component` — компонент, который будет отображаться поверх.

## `OverlayAnchor`

Доступные якоря:

- вертикальные: `Top`, `Middle`, `Bottom`
- горизонтальные: `Start`, `Center`, `End`

В горизонтальном позиционировании намеренно используются `Start` и `End`, а не `Left` и `Right`. matreshka изначально рассчитана не только на LTR-интерфейсы, но и на RTL. Поэтому `Start` означает начало строки в текущем направлении интерфейса, а `End` — конец строки.

Практически:

- в LTR `Start` обычно соответствует левому краю, а `End` — правому;
- в RTL `Start` обычно соответствует правому краю, а `End` — левому.

Например, для русского или английского интерфейса `OverlayAnchor.End` обычно будет означать правый край. Для арабского интерфейса, где направление чтения справа налево, тот же `OverlayAnchor.End` будет означать левый край.

Пример:

```ts
{
  anchors: [OverlayAnchor.Bottom, OverlayAnchor.End],
  component: floatingActionComponent,
}
```

Это означает: расположить overlay внизу у края `End` относительно доступной области данного контейнера. В LTR это будет нижний правый угол, а в RTL — нижний левый.

## Как мысленно понимать overlays

Полезная модель такая:

- есть некоторый контейнер или visual host;
- поверх него можно положить еще один компонент;
- `anchors` задают, где именно этот overlay должен быть закреплен.

Это не то же самое, что `Popover`, потому что у `Popover` есть отдельный якорный компонент и своя логика открытия. Overlay — это именно встроенный механизм наложения компонента поверх контейнера или entry-узла.

## Overlays у обычных компонентов

У обычных контейнерных компонентов overlays чаще всего используются как часть их собственных свойств. Например, у `stack` есть `overlays`.

Пример:

```ts
stack(
  {
    overlays: [
      {
        anchors: [OverlayAnchor.Top, OverlayAnchor.End],
        component: badgeComponent,
      },
    ],
  },
  [text("Карточка")],
);
```

Здесь overlay привязан к конкретному контейнеру `stack` и рендерится поверх него.

Когда это полезно:

- бейдж поверх карточки;
- локальная кнопка действия в углу блока;
- счетчик, иконка или маркер поверх изображения/контейнера.

## Overlays у `Page`

У `Page` overlays задаются через метод `overlays()` и относятся ко всей странице.

Пример:

```ts
protected overlays() {
  return [
    {
      anchors: [OverlayAnchor.Bottom, OverlayAnchor.Center],
      component: floatingActionComponent,
    },
  ];
}
```

Это хороший вариант, когда overlay должен жить на уровне страницы, а не быть частью конкретного контейнера внутри нее.

Типичные сценарии:

- floating action button;
- нижняя плавающая панель;
- плавающий индикатор или snackbar-подобный блок.

## Overlays у `Dialog` и `Popover`

У `Dialog` и `Popover` тоже есть собственные `overlays`.

Пример для `Dialog`:

```ts
new Dialog({
  content: [text("Подтвердите действие")],
  overlays: [
    {
      anchors: [OverlayAnchor.Top, OverlayAnchor.End],
      component: closeButtonComponent,
    },
  ],
});
```

Такой подход полезен, когда поверх самого dialog/popover нужно разместить дополнительный управляющий UI:

- кнопку закрытия;
- дополнительный action;
- локальный индикатор состояния.

## Overlays у `clientPlatform`

Третий уровень — платформенные overlays через `currentClientPlatform().setOverlays(...)`.

Пример:

```ts
currentClientPlatform().setOverlays([
  {
    anchors: [OverlayAnchor.Bottom, OverlayAnchor.Center],
    component: floatingActionComponent,
  },
]);
```

Это уже не overlay конкретного контейнера или страницы, а overlay на уровне клиентской платформы.

Полезно, когда элемент должен жить глобально:

- поверх всего приложения;
- независимо от текущего контейнера страницы;
- как platform-level action bar или глобальная floating-кнопка.

## Разница между тремя уровнями

### 1. Overlay у обычного компонента

Привязан к конкретному компоненту, например к `stack`.

Хорошо подходит для локальных наложений внутри одного блока.

### 2. Overlay у `entry`-компонента

Привязан к `Page`, `Dialog` или `Popover`.

Хорошо подходит для наложений внутри отдельного экрана или отдельного entry-слоя.

### 3. Platform overlay

Привязан к платформенному уровню через `clientPlatform`.

Хорошо подходит для глобальных overlay-элементов приложения.

## Как выбрать правильный уровень

Полезное короткое правило:

- если overlay относится к конкретной карточке, контейнеру или блоку — задавайте его у компонента;
- если overlay относится ко всему экрану или отдельному dialog/popover — задавайте его у `Page` или другого `entry`-компонента;
- если overlay должен жить над приложением как над платформой — используйте `currentClientPlatform().setOverlays(...)`.

## Overlay и `Popover` — не одно и то же

Это важное различие:

- overlay позиционируется через `anchors` внутри некоторого visual host;
- `popover` открывается относительно якорного компонента и живёт как entry: `onEnter` / `onLeave`, а не `onShow` / `onHide`.

Если нужен "плавающий компонент поверх контейнера" — обычно нужен overlay.

Если нужно "всплывающее меню рядом с конкретной кнопкой" — обычно нужен `Popover`.

## Практические примеры

### Бейдж поверх карточки

```ts
stack(
  {
    overlays: [
      {
        anchors: [OverlayAnchor.Top, OverlayAnchor.End],
        component: text("NEW"),
      },
    ],
  },
  [text("Карточка товара")],
);
```

### Floating action button на странице

```ts
protected overlays() {
  return [
    {
      anchors: [OverlayAnchor.Bottom, OverlayAnchor.End],
      component: createButton,
    },
  ];
}
```

### Глобальный platform overlay

```ts
async boot() {
  currentClientPlatform().setOverlays([
    {
      anchors: [OverlayAnchor.Bottom, OverlayAnchor.Center],
      component: globalActionComponent,
    },
  ]);

  return super.boot();
}
```

## Что читать дальше

- [cookbook.md](../recipes/cookbook.md) — короткие прикладные сценарии.
