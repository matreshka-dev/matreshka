# WebMCP

WebMCP — это способ сказать браузерному агенту, какие действия можно выполнить на текущем экране. Вы описываете такие действия на сервере. Клиент показывает их агенту, пока открыт этот экран, и передаёт вызов обратно на BFF.

Действие называется тулзом. У него есть имя, которое видит агент, короткое описание и функция `execute`. Функция выполняется на BFF и возвращает текст. Этот текст агент получает как результат.

Тулзы задаются на entry — страница, диалог или popover — и глобально на клиентской платформе. Пока entry открыт, его тулзы могут быть доступны агенту. Когда entry закрывается, клиент убирает их. Глобальные тулзы остаются при смене страницы.

## Где объявлять

На странице переопределите `tools()`:

```ts
import { Page, text, webMcpTool, WebMcpToolAnnotation } from "@matreshka/bff";

export class OrdersPage extends Page {
  protected title() {
    return "Заказы";
  }

  protected content() {
    return [text("Список заказов")];
  }

  protected tools() {
    return [
      webMcpTool({
        name: "get_order_status",
        description: "Возвращает статус текущего заказа",
        annotations: [WebMcpToolAnnotation.ReadOnlyHint],
        execute: async () => "Заказ в пути",
      }),
    ];
  }
}
```

У диалога и popover тулзы передаются в конфиг:

```ts
dialog({
  tools: [
    webMcpTool({
      name: "confirm",
      description: "Подтверждает действие",
      annotations: [WebMcpToolAnnotation.ConsequentialHint],
      execute: async () => "Подтверждено",
    }),
  ],
  content: [text("Подтвердите действие")],
});
```

`webMcpTool({ ... })` создаёт тулз. Запись `new WebMcpTool({ ... })` делает то же самое: это тот же класс. Имя и описание не могут быть пустыми: иначе создание тулза сразу завершится ошибкой.

## Глобальные тулзы

Тулзы, которые нужны на любом экране, задаются на платформе. Новый список заменяет предыдущий. Пустой массив убирает глобальные тулзы. Тулзы открытой страницы при этом остаются.

```ts
import { currentClientPlatform, webMcpTool } from "@matreshka/bff";
import { firstValueFrom } from "rxjs";

await firstValueFrom(
  currentClientPlatform().setTools([
    webMcpTool({
      name: "get_location",
      description: "Запрашивает геолокацию устройства и возвращает координаты",
      execute: async () => "55,37",
    }),
  ]),
);
```

`getTools()` возвращает текущий глобальный список.

## Аргументы

Если агент должен передать данные, укажите `inputSchema` — схему Zod 4. TypeScript выведет тип аргумента `execute` из этой схемы.

```ts
import { z } from "zod";

webMcpTool({
  name: "add_todo",
  description: "Добавляет задачу",
  inputSchema: z.object({ text: z.string() }),
  execute: async (input) => input.text,
});
```

Здесь `input` имеет тип `{ text: string }`. Клиент отдаёт агенту описание этих полей. Когда агент вызывает тулз, аргументы приходят на BFF. BFF сначала проверяет их схемой. Если они не подходят, агент получает текст ошибки, а `execute` не вызывается.

Без `inputSchema` функция вызывается без аргументов.

## Подсказки агенту

`annotations` — необязательный список подсказок. Агенту и браузеру они помогают понять, насколько вызов безопасен.

| Значение               | Смысл                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| `ReadOnlyHint`         | Тулз только читает данные и ничего не меняет                                  |
| `UntrustedContentHint` | Ответ содержит чужие или непроверенные данные                                 |
| `ConsequentialHint`    | Вызов делает что-то серьёзное или необратимое: оплата, удаление, бронирование |
| `Debugging`            | Тулз для разработки, не для обычного пользователя                             |

Если подсказку не указать, она считается выключенной.

## Когда тулз виден агенту

`conditions` — те же условия, что у компонентов и действий: `when` и `device`. Несколько условий в массиве означают «и». Для «или» используйте `when.any()` и `when.all()`, как в [Conditions](conditions.md).

```ts
protected tools() {
  return [
    webMcpTool({
      name: "save_draft",
      description: "Сохраняет черновик",
      conditions: [when.equals(this.context.ref("mode"), "edit")],
      execute: async () => "Черновик сохранён",
    }),
  ];
}
```

Пока условие выполнено, клиент показывает тулз агенту. Когда условие перестаёт выполняться, клиент убирает тулз. Без `conditions` тулз доступен всё время, пока открыт entry.

BFF при вызове эти условия ещё раз не проверяет. Если нужна жёсткая проверка уже в момент выполнения, напишите её внутри `execute`.

## Имена

Агент выбирает тулз по имени. На сервере два тулза могут называться одинаково: у них разные внутренние id, и вызов идёт по id.

В браузере имя должно быть уникальным. Старайтесь сразу задавать разные имена: агент выбирает тулз по тому, как оно звучит, и суффикс ему только мешает. Если в один момент всё же доступны два тулза с одним именем, клиент оставляет первое имя как есть, а следующему добавляет суффикс: `save`, `save_2`, `save_3`. Когда тулз пропадает, его имя освобождается, и следующее такое имя снова может быть без суффикса.

## Что возвращает execute

`execute` — обычная async-функция на BFF. Её результат — строка, её и видит агент.

Если функция выбрасывает ошибку, агент получает текст этой ошибки. Сам UI при этом не обязан меняться: меняйте его в `execute` так же, как в обработчике кнопки, через контекст и команды компонентов.

## Пример: сохранить заметку

Пользователь открыл экран заметки. Заголовок и текст лежат в контексте и показаны в полях ввода. Агент может заполнить эти поля и сохранить заметку тулзом `save_note`.

`context.set` отправляет новые значения в поля на экране. `saveNote` — уже ваш запрос в базу или API. Агенту возвращается короткая строка с результатом.

```ts
import { Context, Page, textInput, textarea, webMcpTool } from "@matreshka/bff";
import { z } from "zod";

type NoteState = {
  title: string;
  text: string;
};

export class NotePage extends Page {
  context = new Context<NoteState>({
    data: async () => ({
      title: "",
      text: "",
    }),
  });

  protected async boot() {
    await this.context.init();
  }

  protected title() {
    return "Заметка";
  }

  protected content() {
    return [
      textInput({ placeholder: "Заголовок" }, this.context.ref("title")),
      textarea({ placeholder: "Текст" }, this.context.ref("text")),
    ];
  }

  protected tools() {
    return [
      webMcpTool({
        name: "save_note",
        description: "Заполняет заголовок и текст заметки и сохраняет её",
        inputSchema: z.object({
          title: z.string(),
          text: z.string(),
        }),
        execute: async (input) => {
          this.context.set({
            title: input.title,
            text: input.text,
          });
          await this.saveNote(input);
          return `Заметка «${input.title}» сохранена`;
        },
      }),
    ];
  }

  private async saveNote(_note: NoteState) {
    // Запрос в базу или ваш API.
  }
}
```

## Пример: предзаполнить и подождать экран

Агент может только подставить данные, а сохранение оставить человеку. На экране те же поля и кнопка «Сохранить».

`context.set` сразу отправляет значения, но поля на клиенте меняются чуть позже. `lastValueFrom` ждёт, пока клиент получит это изменение. Ответ агенту уходит после этого, когда поля уже заполнены.

```ts
import { button, text, textInput, textarea, webMcpTool } from "@matreshka/bff";
import { lastValueFrom } from "rxjs";
import { z } from "zod";

protected content() {
  return [
    textInput({ placeholder: "Заголовок" }, this.context.ref("title")),
    textarea({ placeholder: "Текст" }, this.context.ref("text")),
    button(
      {
        onClick: () =>
          this.saveNote({
            title: this.context.get("title"),
            text: this.context.get("text"),
          }),
      },
      [text("Сохранить")],
    ),
  ];
}

protected tools() {
  return [
    webMcpTool({
      name: "fill_note",
      description: "Подставляет заголовок и текст в поля заметки и не сохраняет её",
      inputSchema: z.object({
        title: z.string(),
        text: z.string(),
      }),
      execute: async (input) => {
        await lastValueFrom(
          this.context.set({
            title: input.title,
            text: input.text,
          }),
        );
        return "Поля заполнены. Проверьте данные и нажмите «Сохранить»";
      },
    }),
  ];
}
```

Как устроена доставка `context.set`, описано в [Context](context.md).

## Пример: команда платформы

Команды клиентской платформы устроены так же: вызов сразу уходит на клиент и возвращает сигнал. `firstValueFrom` ждёт, пока клиент сообщит, что действие выполнено. Если клиент ответил ошибкой, ожидание прерывается, и агент получает текст этой ошибки.

Ниже тулз запрашивает геолокацию. Браузер сначала спрашивает разрешение, потом определяет координаты. `firstValueFrom` ждёт всё это время. Отдельный `catch` не нужен: если человек запретил доступ или координаты получить не удалось, ошибка выходит из `execute`, и агент получает её текст.

```ts
import {
  BrowserPlatform,
  currentClientPlatform,
  webMcpTool,
} from "@matreshka/bff";
import { firstValueFrom } from "rxjs";

webMcpTool({
  name: "get_location",
  description: "Запрашивает геолокацию устройства и возвращает координаты",
  execute: async () => {
    const platform = currentClientPlatform();
    const { latitude, longitude } = await firstValueFrom(
      platform.getGeolocation(),
    );
    return `Координаты: ${latitude}, ${longitude}`;
  },
});
```

Так же ждут «Поделиться», скачивание файла, переход на другую страницу и остальные команды. Список методов — в [Platform API](../reference/platforms.md).
