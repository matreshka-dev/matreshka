# События и действия на события

Этот раздел описывает, как BFF реагирует на события компонентов и страниц, и чем серверные обработчики отличаются от клиентских действий.

## Общая идея

С точки зрения BFF важно различать три вещи:

- событие, которое клиент отправляет в BFF;
- серверный обработчик события;
- `LocalAction`, который исполняется на клиенте.

События появляются после пользовательских действий или lifecycle-сигналов клиента: `onClick`, `onSubmit`, `onScroll`, `onShow`, `onHide`, `onEnter`, `onLeave`, `onMouseEnter`, `onMouseLeave` и специализированных событий конкретных компонентов.

## Серверный обработчик события

Серверный обработчик выполняется на BFF. Используйте его, когда нужно принять
бизнес-решение, вызвать backend-сервис или выполнить другую серверную логику.

Обработчик получает **`instance`** — конкретный инстанс компонента на клиенте, инициировавший событие (подробнее в advanced-разделе `component-instance.md`):

```ts
button(
  {
    onClick: async ({ instance }) => {
      await this.draftService.save(this.context.value("draft"));
      // instance.id — id DOM-инстанса; instance.component — BFF-объект
    },
  },
  [text("Сохранить")],
);
```

### Async и ошибки

`ServerAction` перехватывает reject **только у promise, который вернул обработчик**. Синхронный `throw` и `await` внутри `async`-функции тоже попадают в `client.error$`, а не в `unhandledRejection`.

Не оборачивайте async-вызов во внутренний `void` — снаружи обработчик тогда возвращает `undefined`, и BFF не видит promise:

```ts
// Плохо: ошибка снова уйдёт в unhandledRejection
onClick: () => {
  void this.save();
};

// Хорошо: Matreshka перехватит reject возвращённого promise
onClick: () => this.save();
```

## Обработчик с payload

Некоторые события передают payload. Например, scroll-событие страницы сообщает размеры и текущий offset.

```ts
class FeedPage extends Page {
  protected onScroll() {
    return ({ payload }) => {
      const nearEnd =
        payload.contentSize - payload.offset - payload.viewportSize < 150;

      if (nearEnd) {
        this.feedContext.setValue("loadingMore", true);
      }
    };
  }

  protected title() {
    return "Лента";
  }

  protected content() {
    return [text("Скролльте вниз")];
  }
}
```

## События без payload

`onShow`, `onHide`, `onEnter`, `onLeave`, `onMouseEnter` и `onMouseLeave` не передают payload. Клиент отправляет interaction с `target` — id инстанса компонента.

- `onShow` — после первого рендера компонента на клиенте;
- `onHide` — при уничтожении компонента (перед удалением из DOM);
- `onEnter` — после первого рендера entry-компонента (`Page`, `Dialog`, `Popover`);
- `onLeave` — в момент начала ухода entry-компонента; клиент сразу запускает local actions, а BFF сразу выполняет server handlers;
- `onMouseEnter` / `onMouseLeave` — при наведении и уходе курсора с host-элемента компонента.

## Regular и entry lifecycle

### Regular-компоненты

`Regular` — это обычные компоненты внутри дерева страницы, диалога или popover: `stack`, `text`, `button`, `image`, `forEach` и т.д.

- у них есть `conditions`, поэтому они могут появляться и исчезать в уже живом UI;
- их lifecycle-события: `onShow` и `onHide`;
- `onShow` означает, что конкретный узел появился на клиенте;
- `onHide` означает, что конкретный узел скрывается или снимается из DOM.

### Entry-компоненты

`Entry` — это `Page`, `Dialog`, `Popover`. Они живут как самостоятельные точки входа в интерфейс.

- у них **нет** `conditions`;
- вместо `onShow` / `onHide` у них используются `onEnter` / `onLeave`;
- `onEnter` означает, что entry уже смонтирован и впервые показан клиенту;
- `onLeave` означает, что entry **начал уходить**, но ещё не уничтожен окончательно.

Пример с `LocalAction`:

```ts
stack(
  {
    onMouseEnter: setContextValue(this.context.ref("hovered"), true),
    onMouseLeave: setContextValue(this.context.ref("hovered"), false),
  },
  [text("Hover")],
);
```

Подробнее — в [cookbook.md](../recipes/cookbook.md) (раздел «Реакция на наведение курсора»).

## `LocalAction`

Если действие должно выполняться именно на клиенте, используйте заранее заданные локальные действия. Такой action передаётся в обработчик события и исполняется client runtime без переноса этой логики в BFF.

На одно событие можно передать несколько действий: для этого укажите массив обработчиков или `LocalAction`.

```ts
import {
  animate,
  ComponentAnimationEffect,
  DimensionalUnit,
} from "@matreshka/bff/core";

const bounceAnimation = animate({
  duration: 180,
  effects: {
    [ComponentAnimationEffect.TranslateY]: {
      0: { value: 0, unit: DimensionalUnit.Px },
      50: { value: -4, unit: DimensionalUnit.Px },
      100: { value: 0, unit: DimensionalUnit.Px },
    },
  },
});

button(
  {
    onClick: [bounceAnimation, () => this.analytics.trackButtonClick()],
  },
  [text("Нажать")],
);
```

## Изменение Context как `LocalAction`

Для записи в `Context` без `server-interaction` есть локальные действия. Клиент сразу обновляет своё зеркало контекста и синхронизирует изменение на BFF.

```ts
import {
  setContextValue,
  setContextValues,
  toggleContextValue,
} from "@matreshka/bff/core";

button(
  {
    onClick: setContextValue(this.context.ref("loading"), true),
  },
  [text("Загрузка")],
);

button(
  {
    onClick: toggleContextValue(this.context.ref("enabled")),
  },
  [text("Переключить")],
);

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

Типы жёсткие: `value` должен совпадать с типом значения по `ref`, а `toggleContextValue` принимает только boolean-`ref`.

## Анимация как `LocalAction`

Анимации тоже можно запускать как клиентское действие на событие. В примере
выше `bounceAnimation` выполняется на клиенте, а отправка аналитики — на BFF.

## `conditions` у действий

У действий тоже могут быть `conditions`. Это полезно, когда событие должно оставаться тем же, но конкретное действие нужно выполнять только в определенном состоянии контекста или на определенном типе устройства.

`conditions` у действия отвечают не за видимость компонента, а за запуск конкретного action. Компонент может быть видимым, событие может произойти, но действие будет пропущено, если его условия не выполнены.

Пример с клиентским действием:

```ts
import { writeTextToClipboard } from "@matreshka/bff/core";
import { when } from "@matreshka/bff/core/conditions";

button(
  {
    onClick: writeTextToClipboard("Скопировано", {
      conditions: [when.equals(this.context.ref("canCopy"), true)],
    }),
  },
  [text("Копировать")],
);
```

Пример с анимацией:

```ts
animate({
  duration: 180,
  effects: {
    [ComponentAnimationEffect.Opacity]: {
      0: 0,
      100: 1,
    },
  },
  conditions: [when.equals(this.context.ref("highlight"), true)],
});
```

Пример с серверным обработчиком:

```ts
new ServerAction(
  () => {
    this.context.setValue("submitted", true);
  },
  {
    conditions: [when.equals(this.context.ref("enabled"), true)],
  },
);
```

Логика проверки одинаковая для всех действий:

- если `conditions` не заданы или список пустой, действие считается доступным;
- все условия должны выполниться одновременно, то есть между ними логическое `AND`;
- если хотя бы одно условие не выполнено, конкретное действие не запускается.

Где выполняется проверка:

- `LocalAction` проверяется на клиенте перед запуском действия. Поэтому, например, `writeTextToClipboard`, `animate` или `setContextValue` могут быть пропущены без round-trip в BFF.
- `ServerAction` проверяется на клиенте перед отправкой interaction в BFF и повторно на BFF перед вызовом handler. Клиентская проверка экономит лишнее сообщение, а серверная остается обязательной защитой от устаревшего состояния или ручного сообщения.

Важно: при одном событии клиент **сначала** отбирает все действия, у которых выполнены `conditions`, и только потом выполняет этот список. Порядок условных действий в массиве не влияет на то, какие из них попадут в выборку: взаимоисключающие условия смотрят на одно и то же исходное состояние Context, а не на промежуточные результаты соседних `LocalAction`.

Важно отличать эти условия от `conditions` компонента: component `conditions` решают, рендерить ли компонент, а action `conditions` решают, выполнять ли конкретное действие после события.

Список всех доступных классов условий — в [`conditions.md`](conditions.md).

## Форма входа: мгновенный UI и защита от повторной отправки

Типичный сценарий: форма с полями `login`, `password` и флагом `loading`. На клик нужно сразу показать состояние загрузки и при этом не отправить запрос повторно, если пользователь нажал кнопку ещё раз.

```ts
import {
  button,
  Page,
  PasswordInputKind,
  passwordInput,
  ServerAction,
  text,
  TextInputKind,
  textInput,
} from "@matreshka/bff/components";
import { Context, setContextValue } from "@matreshka/bff/core";
import { when } from "@matreshka/bff/core/conditions";

class SignInPage extends Page {
  context = new Context({
    data: async () => ({
      login: "",
      password: "",
      loading: false,
    }),
  });

  protected title() {
    return "Вход";
  }

  protected content() {
    return [
      textInput(
        { kind: TextInputKind.Email, placeholder: "Email" },
        this.context.ref("login"),
      ),
      passwordInput(
        {
          kind: PasswordInputKind.CurrentPassword,
          placeholder: "Пароль",
        },
        this.context.ref("password"),
      ),
      button(
        {
          onClick: [
            // Сразу на клиенте: UI обновляется без ожидания ответа BFF.
            setContextValue(this.context.ref("loading"), true),
            // На сервер уходит только если в момент клика loading ещё false.
            new ServerAction(
              () => {
                // авторизация...
                this.context.setValue("loading", false);
              },
              {
                conditions: [when.equals(this.context.ref("loading"), false)],
              },
            ),
          ],
          rules: [
            {
              conditions: [when.equals(this.context.ref("loading"), true)],
              overrides: {
                content: [text("Входим...")],
              },
            },
          ],
        },
        [text("Войти")],
      ),
    ];
  }
}
```

Что происходит при первом клике (`loading === false`):

1. клиент отбирает оба действия — у `setContextValue` условий нет, у `ServerAction` условие выполняется;
2. `setContextValue` сразу пишет `loading: true` в клиентское зеркало Context → `rules` меняют текст кнопки на «Входим...» без задержки сети;
3. `ServerAction` всё равно выполняется: он уже был в списке до записи `loading`, поэтому порядок в массиве здесь не мешает.

При повторном клике, пока `loading === true`:

- `setContextValue` снова выполнится (условия нет), но значение уже `true`;
- `ServerAction` клиент пропустит — условие `loading == false` не выполняется, лишний запрос на BFF не уйдёт.

Так решаются сразу две задачи: мгновенная реакция UI и защита от повторной отправки формы.

## Что читать дальше

**Следующий обязательный шаг:** [Layout](layout.md) — правила компоновки
компонентов.

Дополнительно:

- [Component instances](../advanced/component-instance.md) — instance id и команды;
- [Platform API](../reference/platforms.md) — API клиентских платформ.
