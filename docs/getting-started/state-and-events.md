# Состояние и события

**Цель:** одна страница с формой, server-действиями и условным текстом из контекста.

**Предпосылки:** [Первое приложение](first-app.md).

## Сценарий одной страницы

На экране **«Приветствие»** пользователь:

1. вводит имя в поле, связанное с `Context`;
2. нажимает **«Отправить»** — BFF в `onSubmit` записывает в контекст строку приветствия;
3. может нажать **«Очистить»** — отдельный `onClick` на сервере сбрасывает приветствие;
4. видит блок **«Значение: …»** только когда приветствие не пустое (`conditions` + текст с плейсхолдером из контекста).

Ниже — **один** класс страницы, в котором собраны все эти шаги.

## Страница целиком

Зарегистрируйте route так же, как в [first-app](first-app.md), например `app.router.addPage("/greet", async () => new GreetPage())`.

```ts
import { Context } from "@matreshka/bff/core";
import { when } from "@matreshka/bff/core/conditions";
import { Page, button, form, text, textInput } from "@matreshka/bff/components";

type GreetState = {
  name: string;
  greeting: string;
};

export class GreetPage extends Page {
  context = new Context<GreetState>({
    data: async () => ({
      name: "",
      greeting: "",
    }),
  });

  protected async boot() {
    await this.context.init();
  }

  protected title() {
    return "Приветствие";
  }

  protected content() {
    const nameRef = this.context.ref("name");
    const greetingRef = this.context.ref("greeting");

    const onSubmit = () => {
      const name = this.context.value("name");
      this.context.setValue("greeting", name ? `Привет, ${name}!` : "");
    };

    return [
      form({ onSubmit }, [
        textInput(nameRef),
        button({ type: "submit" }, [text("Отправить")]),
      ]),

      button(
        {
          onClick: () => {
            this.context.setValue("greeting", "");
          },
        },
        [text("Очистить")],
      ),

      text(
        {
          conditions: [when.notEquals(greetingRef, "")],
        },
        `Значение: ${greetingRef.toString()}`,
      ),
    ];
  }
}
```

## Как связаны части

### Контекст и поле ввода

`nameRef` и `greetingRef` передаются в UI как **`ContextRef`**, а не как `value()` — клиент подписывается на изменения и обновляет поле и текст. В обработчике submit допустимо разово прочитать `this.context.value("name")` и записать результат через `setValue`.

### Форма и server `onClick`

`onSubmit` формы и `onClick` кнопки «Очистить» выполняются **на BFF**; оба меняют одно и то же поле `greeting`, поэтому условный блок внизу реагирует на оба действия.

Подробнее про async-обработчики и `LocalAction` — [События и действия](../guides/events-and-actions.md).

### Условие и смешанный текст

- **`conditions`** — список готовых условий из `when` (не произвольные функции). Здесь `when.notEquals(greetingRef, "")` скрывает блок, пока приветствие пустое.
- **Шаблонная строка** — статический префикс `Значение: ` и плейсхолдер `${greetingRef.toString()}`. Без `.toString()` ref в строке не превратится в подстановку, которую клиент обновляет при смене контекста.

Полный список условий — [Conditions](../guides/conditions.md). Плейсхолдеры в строках — также [Context](../guides/context.md).

### `boot()` и `init()`

`await this.context.init()` в `boot()` нужен, если в `content()` или overlays вы читаете контекст до готовности данных (preload, route-параметры, асинхронный `data`). Для простого `data: async () => ({ ... })` на странице это хороший шаблон для `Page` с `Context`.

## Ожидаемый результат

После submit под формой появляется строка вида «Значение: Привет, Alice!». «Очистить» убирает блок. Имя в поле остаётся, пока пользователь его не изменит.

## Что дальше

Продолжите основной маршрут:

**Следующий обязательный шаг:** [Следующие шаги](next-steps.md) — порядок всех
базовых руководств от роутинга и `Context` до layout и overlays.
