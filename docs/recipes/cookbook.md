# Cookbook

Короткие рецепты: **одна задача — один фрагмент кода**. Этот раздел рассчитан
на разработчика, который уже прошёл
[основной маршрут](../getting-started/next-steps.md): getting started и все
базовые guides.

Если вы пришли сюда раньше, начните с
[обзора](../getting-started/overview.md). Полные props ищите в
[reference](../reference/README.md).

---

Ниже — рецепты по одной конкретной задаче.

## Простая текстовая страница

Задача: показать статический экран.

```ts
class WelcomePage extends Page {
  protected title() {
    return "Welcome";
  }

  protected content() {
    return [text("Добро пожаловать")];
  }
}
```

Полезно, когда нужно проверить route, transport и отправку `AppPageMessage`.

## Кнопка-переход

Задача: отправить пользователя на другой route.

```ts
button({ link: { value: "/settings" } }, [text("Настройки")]);
```

Это самый короткий способ навигации без явного `onClick`.

## Навигация с BFF

Задача: принять решение на сервере и только потом перенаправить.

```ts
button(
  {
    onClick: () => {
      const isAuthorized = this.context.value("isAuthorized");

      if (isAuthorized) {
        currentClientPlatform().navigate("/dashboard");
      } else {
        currentClientPlatform().navigate("/login");
      }
    },
  },
  [text("Продолжить")],
);
```

Подходит для сценариев, где путь зависит от серверной логики.

Важно: при таком подходе у элемента не будет классической ссылки в разметке браузера, потому что переход происходит через обработчик `onClick`. Из-за этого пользователь не сможет открыть такой переход в новой вкладке или новом окне стандартными браузерными способами.

## Ссылка с `link` и плейсхолдером из контекста

Задача: оставить у элемента обычную ссылку, но собрать ее из серверного контекста.

```ts
context = new Context({
  data: async () => ({
    userId: "42",
  }),
});

button(
  {
    link: {
      value: `/users/${this.context.ref("userId").toString()}`,
    },
  },
  [text("Открыть профиль")],
);
```

В этом случае в `link.value` участвует плейсхолдер из контекста, а сам элемент остается именно ссылкой. Для браузера это важное отличие от `navigate()` в `onClick`: такую ссылку можно открыть в новой вкладке или новом окне.

## Поле ввода, связанное с контекстом

Задача: хранить введенное значение в BFF-контексте.

```ts
context = new Context({
  data: async () => ({ name: "" }),
});

textInput(this.context.ref("name"));
```

Клиент будет отправлять `context-values`, а BFF будет обновлять `Context`.

## Отобразить введенное значение

Задача: показать live preview введенного текста.

```ts
[textInput(this.context.ref("name")), text(this.context.ref("name"))];
```

Это один из самых простых способов увидеть двустороннюю синхронизацию в действии.

## Форма с submit

Задача: обработать Enter и кнопку отправки.

```ts
const submitForm = () => {
  const name = this.context.value("name");
  this.context.setValue("result", `Привет, ${name}`);
};

form(
  {
    onSubmit: submitForm,
  },
  [
    textInput(this.context.ref("name")),
    button({ onClick: submitForm }, [text("Отправить")]),
  ],
);
```

Здесь важен именно компонент `form`, а не просто пара `textInput + button`. Он нужен для корректной обработки отправки формы в целом, потому что пользователь не всегда завершает сценарий кликом по кнопке.

Другие типичные варианты:

- пользователь нажимает `Enter`, находясь в поле ввода;
- на мобильном устройстве нажимает кнопку отправки на экранной клавиатуре;
- браузер или runtime инициирует стандартный submit-сценарий формы без отдельного клика по кнопке.

Поэтому хороший практический паттерн такой:

- основную логику держать в одном обработчике, например `submitForm`;
- подключать его в `onSubmit`;
- при необходимости дополнительно вешать тот же обработчик на `onClick` кнопки.

Если нужна именно визуальная реакция на submit, анимацию тоже можно привязать к `onSubmit`:

```ts
const submitButton = button([text("Отправить")]);

form(
  {
    onSubmit: animate({
      componentId: submitButton.id,
      duration: 160,
      effects: {
        [ComponentAnimationEffect.Opacity]: {
          0: 0.5,
          100: 1,
        },
      },
    }),
  },
  [textInput(this.context.ref("name")), submitButton],
);
```

Результат можно показать рядом:

```ts
text(this.context.ref("result"));
```

## Скрыть блок, пока нет значения

Задача: показывать сообщение только после заполнения поля.

```ts
text(
  {
    conditions: [when.defined(this.context.ref("name"))],
  },
  "Поле заполнено",
);
```

И обратный вариант:

```ts
text(
  {
    conditions: [when.notDefined(this.context.ref("name"))],
  },
  "Введите имя",
);
```

## Кнопка с состоянием загрузки

Задача: поменять текст кнопки после нажатия.

```ts
button(
  {
    onClick: () => this.context.setValue("loading", true),
    rules: [
      {
        conditions: [when.equals(this.context.ref("loading"), true)],
        overrides: {
          content: [text("Загрузка")],
        },
      },
    ],
  },
  [text("Отправить")],
);
```

Хороший шаблон для submit, upload и async-процессов.

## Анимация по клику

Задача: запустить короткую локальную анимацию на том же компоненте, по которому кликнули.

```ts
button(
  {
    onClick: animate({
      duration: 180,
      effects: {
        [ComponentAnimationEffect.TranslateY]: {
          0: { value: 0, unit: DimensionalUnit.Px },
          50: { value: -4, unit: DimensionalUnit.Px },
          100: { value: 0, unit: DimensionalUnit.Px },
        },
      },
    }),
  },
  [text("Подпрыгнуть")],
);
```

Если `componentId` не указан, анимация применяется к тому же компоненту, на котором произошло событие.

## Анимация при появлении компонента

Задача: плавно показать блок, когда он появляется на экране.

```ts
stack(
  {
    onShow: animate({
      duration: 250,
      effects: {
        [ComponentAnimationEffect.Opacity]: {
          0: 0,
          100: 1,
        },
      },
    }),
  },
  [text("Плавное появление")],
);
```

Такой рецепт удобен для enter-анимации карточек, баннеров и всплывающих блоков.

## Реакция на наведение курсора

Задача: показать подсказку или изменить состояние при наведении — например, синхронизировать флаг в `Context` или запустить анимацию.

`onMouseEnter` и `onMouseLeave` доступны у любого компонента. Payload у событий нет.

```ts
import { setContextValue } from "@matreshka/bff/core";
import { stack, text } from "@matreshka/bff/components";

stack(
  {
    onMouseEnter: setContextValue(this.context.ref("hovered"), true),
    onMouseLeave: setContextValue(this.context.ref("hovered"), false),
  },
  [text("Наведи на меня")],
);
```

Для server-обработчика доступен `instance` — тот же инстанс, что и при `onClick`:

```ts
stack(
  {
    onMouseEnter: ({ instance }) => {
      console.log("hover", instance.id);
    },
  },
  [text("Карточка")],
);
```

На одно событие можно повесить массив действий — как у `onClick`: `LocalAction` (анимация, запись в Context) и server-handler в одном списке.

## Анимация другого компонента по событию

Задача: кликнуть по кнопке, но анимировать другой компонент.

```ts
const banner = text("Сохранено");

[
  banner,
  button(
    {
      onClick: animate({
        componentId: banner.id,
        duration: 300,
        effects: {
          [ComponentAnimationEffect.Opacity]: {
            0: 0.4,
            100: 1,
          },
        },
      }),
    },
    [text("Подсветить баннер")],
  ),
];
```

Это полезно, когда событие и визуальная реакция происходят на разных элементах.

## Анимация подложки диалога

Задача: отдельно анимировать окно диалога и его подложку (`::backdrop`).

Подложка настраивается свойством `backdrop` у `Dialog`, а не через общий `animate`. У немодального диалога (`modal: false`) подложки нет. Для размытия фона за элементом используйте `ComponentAnimationEffect.BackdropBlur` (`backdrop-filter: blur(...)`); `Blur` размывает сам элемент (`filter: blur(...)`). Чтобы blur на `surface` в overlay затухал к краю (шапка/composer поверх скролла), задайте `mask` с `ColorTokenMaskType.LinearGradient` на color token — см. [client-settings.md](../reference/client-settings.md#mask-mask-image-для-linear-gradient).

```ts
import { dialog, text } from "@matreshka/bff/components";
import { animate, ComponentAnimationEffect } from "@matreshka/bff/core";

dialog(
  {
    onEnter: animate({
      duration: 200,
      effects: {
        [ComponentAnimationEffect.Opacity]: {
          0: 0,
          100: 1,
        },
      },
    }),
    onLeave: animate({
      duration: 200,
      effects: {
        [ComponentAnimationEffect.Opacity]: {
          100: 0,
        },
      },
    }),
    backdrop: {
      onEnter: animate({
        duration: 200,
        effects: {
          [ComponentAnimationEffect.Opacity]: {
            0: 0,
            100: 1,
          },
          [ComponentAnimationEffect.BackdropBlur]: {
            0: 0,
            100: 16,
          },
        },
      }),
      onLeave: animate({
        duration: 200,
        effects: {
          [ComponentAnimationEffect.Opacity]: {
            100: 0,
          },
          [ComponentAnimationEffect.BackdropBlur]: {
            100: 0,
          },
        },
      }),
    },
  },
  [text("Содержимое")],
);
```

## Простой список через `forEach`

Задача: отрисовать массив из `Context`.

```ts
context = new Context({
  data: async () => ({
    items: [
      { id: "1", title: "Первый" },
      { id: "2", title: "Второй" },
    ],
  }),
});

forEach({
  ref: this.context.ref("items"),
  track: (item) => item.id,
  generator: ({ ref }) => text(ref.ref("title")),
});
```

## Пустое состояние списка

Задача: показать текст, если массив пуст.

```ts
text(
  {
    conditions: [when.isEmpty(this.context.ref("items"))],
  },
  "Список пуст",
);
```

Это удобно ставить перед `forEach`.

## Добавление элемента в список

Задача: дополнять массив на сервере.

```ts
button(
  {
    onClick: () => {
      const items = this.context.value("items");
      this.context.setValue("items", [
        ...items,
        { id: crypto.randomUUID(), title: "Новый элемент" },
      ]);
    },
  },
  [text("Добавить")],
);
```

Если делаете неиммутабельную мутацию, не забудьте `emitAfterInPlaceMutation()`.

## Popover от кнопки

Задача: открыть локальное меню действий.

```ts
button(
  {
    onClick: ({ instance }) => {
      currentClientPlatform().showPopover(
        instance,
        new Popover({
          content: [button([text("Редактировать")]), button([text("Удалить")])],
        }),
      );
    },
  },
  [text("Действия")],
);
```

`Popover` обычно используют для локальных действий, связанных с конкретным элементом интерфейса: кнопкой, карточкой, пунктом списка. У `popover` всегда есть якорь, относительно которого он открывается. В примере выше таким якорем выступает `instance` из `onClick` (конкретный инстанс компонента на клиенте), поэтому `showPopover()` принимает два аргумента: инстанс якоря и сам `Popover`.

## Dialog подтверждения

Задача: показать отдельный entry-компонент поверх страницы.

```ts
button(
  {
    onClick: () => {
      currentClientPlatform().showDialog(
        new Dialog({
          content: [text("Вы уверены?")],
        }),
      );
    },
  },
  [text("Удалить")],
);
```

`Dialog` и `Popover` похожи тем, что оба показывают отдельный entry-компонент поверх текущей страницы, но используются по-разному:

- `popover` привязан к конкретному якорю в интерфейсе и подходит для небольших локальных меню или вспомогательных действий;
- `dialog` не привязан к элементу-якорю и подходит для подтверждений, отдельных сценариев ввода и более самостоятельного содержимого.

Если нужен UI "рядом с этой кнопкой", обычно подходит `popover`. Если нужен самостоятельный слой поверх страницы без привязки к конкретному элементу, обычно нужен `dialog`.

## Floating overlay

Задача: закрепить компонент поверх страницы.

```ts
async boot() {
  currentClientPlatform().setOverlays([
    {
      anchors: [OverlayAnchor.Bottom, OverlayAnchor.Center],
      component: button([text("Создать")]),
    },
  ]);

  return super.boot();
}
```

## Копирование в буфер обмена

Задача: выполнить действие на клиенте без дополнительного server handler.

```ts
button(
  {
    onClick: writeTextToClipboard("Скопировано"),
  },
  [text("Копировать")],
);
```

## Запись в Context на клиенте

Задача: обновить значение в `Context` сразу на клиенте без `server-interaction`.

```ts
button(
  {
    onClick: setContextValue(this.context.ref("loading"), true),
  },
  [text("Загрузка")],
);
```

Boolean-флаг можно инвертировать:

```ts
button(
  {
    onClick: toggleContextValue(this.context.ref("enabled")),
  },
  [text("Переключить")],
);
```

Несколько полей за один клик:

```ts
button(
  {
    onClick: setContextValues([
      { ref: this.context.ref("loading"), value: true },
      { ref: this.context.ref("dirty"), value: true },
    ]),
  },
  [text("Сохранить черновик")],
);
```

Клиент сразу обновляет UI и отправляет `context-values` на BFF.

## Переключение темы

Задача: дать пользователю вручную включить темную тему.

```ts
button(
  {
    onClick: () => currentClientPlatform().setColorSchemeDark(),
  },
  [text("Темная тема")],
);
```

## Privacy mode

Задача: быстро скрыть чувствительные данные на клиенте.

```ts
button(
  {
    onClick: () => currentClientPlatform().enablePrivacyMode(),
  },
  [text("Скрыть данные")],
);
```

`Privacy mode` — это платформозависимая возможность. На BFF он включается одинаково через `currentClientPlatform().enablePrivacyMode()`, но реальный эффект зависит от того, где запущено приложение.

Типичные варианты поведения:

- в web-платформах содержимое может размываться, когда окно теряет фокус;
- в мобильных приложениях может включаться нативная защита экрана от предпросмотра или запись/скриншот-защита, если платформа это поддерживает;
- в других платформах реализация может отличаться или быть ограниченной.

Поэтому `privacy mode` лучше воспринимать как абстрактную команду "скрыть чувствительное содержимое", а не как строго одинаковый визуальный эффект на всех платформах.

## Получить список устройств

Задача: запросить доступные медиа-устройства.

```ts
button(
  {
    onClick: () => {
      currentClientPlatform().enumerateDevices({
        onSuccess: (devices) => {
          console.log(devices);
        },
      });
    },
  },
  [text("Устройства")],
);
```

Это особенно полезно для camera-сценариев: через `enumerateDevices()` можно получить список доступных камер (`videoinput`), показать его пользователю и использовать для переключения между устройствами.

## Route с параметром

Задача: открыть страницу пользователя по id.

```ts
app.router.addPage("/users/{id}", async (_client, params) => {
  return new UserPage(params.id);
});
```

Минимальный page-класс:

```ts
class UserPage extends Page {
  constructor(private userId: string) {
    super();
  }

  protected title() {
    return "Пользователь";
  }

  protected content() {
    return [text(`Пользователь: ${this.userId}`)];
  }
}
```

## Guard через `undefined`

Задача: не пускать на route без проверки.

```ts
async function getRoleFromJwt(jwt?: string) {
  if (!jwt) {
    return undefined;
  }

  const session = await authService.findSessionByJwt(jwt);
  return session?.role;
}

app.router.addPage("/admin", async (client) => {
  const jwt = client.storage.get("jwt");
  const role = await getRoleFromJwt(jwt);

  return role === "admin" ? new AdminPage() : undefined;
});
```

## Способы инициализации контекста

Задача: выбрать правильный момент, когда `Context` должен загрузить initial data и отправить их клиенту.

### 1. `preload`: загрузить заранее

```ts
context = new Context({
  preload: true,
  data: async () => ({
    notifications: [],
  }),
});
```

Этот режим полезен, когда UI почти сразу опирается на данные контекста и вы заранее знаете, что они понадобятся сразу после авторизации клиента.

### 2. Lazy: инициализировать по первому запросу

```ts
context = new Context({
  data: async () => ({
    profile: null,
  }),
});
```

Если `preload` не указан, контекст работает в lazy-режиме: initial data загружаются не заранее, а тогда, когда клиент впервые запрашивает этот контекст. Это хороший вариант по умолчанию, если контекст может вообще не понадобиться на текущем экране или если вы не хотите заранее тратить время на его загрузку.

### 3. Ручной `init()`: загрузить в конкретный момент

```ts
context = new Context({
  data: async () => ({
    profile: null,
  }),
});

async boot() {
  await this.context.init();
  return super.boot();
}
```

Такой вариант полезен, когда момент инициализации должен контролировать сам BFF.

Короткое практическое правило:

- `preload` — когда данные точно нужны сразу;
- lazy — когда данные могут понадобиться позже или не понадобиться вовсе;
- ручной `init()` — когда момент загрузки должен контролироваться серверной логикой.

## Реакция на `onScroll`

Задача: запустить дозагрузку, когда пользователь почти дошёл до конца **или**
конент короче viewport и скролла ещё нет (большой экран, маленькая первая порция).

Клиент шлёт `ComponentScrollPayload` не только при прокрутке, но и после изменения
размеров/DOM scroll-контейнера — BFF может догружать порции, пока не появится скролл.

```ts
import { needsMore } from "@matreshka/bff/components";

const NEAR_END_PX = 120;

protected onScroll() {
  return ({ payload }) => {
    if (!this.hasMore || this.loadingMore) {
      return;
    }
    if (needsMore(payload, NEAR_END_PX)) {
      this.appendNextBatch();
    }
  };
}
```

## Что читать дальше

- [component-instance.md](../advanced/component-instance.md) — instance id и точечная адресация команд.
- [`../architecture/operations.md`](../architecture/operations.md) — чтобы понять reconnect, ограничения памяти и эксплуатационные особенности runtime.
