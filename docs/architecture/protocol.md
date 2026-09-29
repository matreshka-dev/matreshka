# Протокол сообщений

matreshka общается с клиентом не через специализированный REST API, а через поток сообщений. Transport может быть разным, но payload-ы и message types остаются одинаковыми.

## Базовая форма сообщения

Сообщения без адресации (handshake, page, gateway и т.п.):

```ts
type MessageData = {
  type: string;
  payload?: unknown;
  id?: string;
  attempt?: number;
};
```

Сообщения с адресацией (component, context, platform correlation):

```ts
type TargetedMessageData = MessageData & {
  target: string;
};
```

Transport передаёт обычный JSON. Пример app-level сообщения:

```json
{
  "type": "handshake",
  "payload": {
    "applicationId": "localhost:4200"
  }
}
```

Поля `id` и `attempt` используются только для reliable-сообщений. Подробная логика подтверждений получения, retry, дедупликации и RTT описана в [`message-delivery.md`](message-delivery.md).

## Что означает `target`

Поле `target` есть только у **targeted**-сообщений и задаёт адрес получателя:

- `"<context-id>"` — конкретный `Context`;
- `"<component-instance-id>"` — инстанс компонента на клиенте;
- `"platform-action-<uuid>"` — correlation id для пар request/response между BFF и platform handler на клиенте.

## Основные группы сообщений

### BFF -> client

- init и lifecycle: `handshake`, `page`, `app-reload`, `app-reconnect-info`;
- контексты: `context-init`, `context-values`, `context-destroy`;
- компоненты: лёгкие component commands (`PingableComponentCommandMessage`), тяжёлые вроде `for-each` sync (`ReliableComponentCommandMessage`), dialog/popover show;
- подтверждения получения: `message-received` для reliable client-to-bff сообщений;
- platform commands: navigation, overlays, color scheme, privacy mode, native pickers.

### client -> BFF

- `handshake` — applicationId (первое сообщение от клиента при новом подключении);
- `client-state` — route, platform, storage, language, userAgent;
- component interactions — click, submit, scroll, show/hide и специализированные события;
- context messages — init и values;
- подтверждения получения: `message-received` для reliable bff-to-client сообщений;
- platform feedback и error messages.

## Handshake

При **новом** подключении клиент первым отправляет `handshake`:

```json
{
  "type": "handshake",
  "target": "app",
  "payload": {
    "applicationId": "localhost:4200"
  }
}
```

`applicationId` зависит от платформы: для браузера это `hostname:port`, для мобильного приложения — id пакета.

BFF отвечает своим `handshake`:

```json
{
  "type": "handshake",
  "target": "app",
  "payload": {
    "serverInstanceId": "3d65f509-0e49-4bcc-8ff4-b20ca8177dfb",
    "token": "f8bde652-1eb0-4d3e-9de8-d87ff7a871c3",
    "clientDestroyTimeoutMs": 900000,
    "settings": {
      "appName": "Delta",
      "fonts": {},
      "colors": {}
    }
  }
}
```

Здесь важно:

- `token` нужен для reconnect;
- `serverInstanceId` помогает клиенту понять, не сменился ли серверный instance;
- `settings` задают общую конфигурацию приложения.

При **reconnect** (`?token=...`) клиентский `handshake` не отправляется — BFF отвечает `app-reconnect-info` или `app-reload`.

## Сообщение `client-state`

После handshake клиент сообщает BFF свое текущее состояние:

```json
{
  "type": "client-state",
  "target": "app",
  "payload": {
    "route": {
      "visitedAt": 1719240000000,
      "path": "/",
      "query": {}
    },
    "storage": {},
    "language": "ru",
    "userAgent": "Mozilla/5.0",
    "prefersColorScheme": "system",
    "platform": {
      "id": "web-browser",
      "payload": {}
    }
  }
}
```

Именно `client-state` позволяет BFF:

- выбрать страницу через `Router`;
- понять платформу клиента;
- учитывать локальное storage и настройки интерфейса.

## Сообщение `page`

Когда BFF нашел route и сериализовал страницу, клиент получает `AppPageMessage`:

```json
{
  "type": "page",
  "target": "app",
  "payload": {
    "id": "entry-page-id",
    "class": "page",
    "properties": {
      "title": "Главная",
      "statusCode": 200,
      "content": [
        {
          "id": "text-id",
          "class": "text",
          "properties": {
            "value": "Привет из BFF"
          }
        }
      ],
      "overlays": []
    }
  }
}
```

Важно понимать:

- BFF отправляет не HTML, а сериализованное дерево UI;
- `class` определяет тип компонента;
- `id` нужен для последующих interactions и команд.

## Сообщение `component-click`

Простейшее client-to-bff взаимодействие с компонентом:

```json
{
  "type": "component-click",
  "target": "button-instance-id",
  "payload": {}
}
```

Что это значит:

- клиент сообщает, что пользователь кликнул по компоненту;
- `target` совпадает с `id` компонента из сериализованной страницы;
- `Client` находит зарегистрированные server handlers и вызывает их.

## Сообщение `form-submit`

Отправка формы выглядит так же, только другой type:

```json
{
  "type": "form-submit",
  "target": "form-instance-id",
  "payload": {}
}
```

Это приводит к вызову `onSubmit` у соответствующего `form(...)` на BFF.

## Сообщение `component-scroll`

Скролл несет полезный payload:

```json
{
  "type": "component-scroll",
  "target": "stack-instance-id",
  "payload": {
    "offset": 400,
    "viewportSize": 600,
    "contentSize": 1200
  }
}
```

Такой payload удобно использовать для дозагрузки списков и lazy UI-сценариев.

## Сообщение `component-scroll-to`

BFF → Client: программная прокрутка `stack` (команда `scrollTo` на BFF):

```json
{
  "type": "component-scroll-to",
  "target": "stack-instance-id",
  "payload": {
    "value": -2147483648,
    "smooth": false
  }
}
```

(`value: -2147483648` — это `ScrollToPosition.End` на BFF.)

Поле `value`:

- **`0`** (`ScrollToPosition.Start`) и другие **`>= 0`** — абсолютный offset от начала;
- **`ScrollToPosition.End`** — в конец оси (зарезервированный sentinel);
- **иное `< 0`** — отступ от конца: `maxScroll + value`.

Для вертикальной колонки `maxScroll = scrollHeight - clientHeight`.

## Сообщение `context-init`

Когда клиент впервые начинает работать с контекстом, BFF отправляет initial snapshot:

```json
{
  "type": "context-init",
  "target": "context-id",
  "payload": {
    "name": "Alice",
    "draft": ""
  }
}
```

Обычно это происходит либо при `preload`, либо при первом обращении компонента к `ContextRef`.

## Сообщение `context-values` от BFF к клиенту

Изменения контекста уходят не целиком, а точечно:

```json
{
  "type": "context-values",
  "target": "context-id",
  "payload": [
    { "key": "draft", "value": "Привет" },
    { "key": "profile.name", "value": "Alice" }
  ]
}
```

Это удобно тем, что BFF может посылать только diff, а не заново весь объект.

## Сообщение `context-values` от клиента к BFF

Когда значение меняется на клиенте, оно приходит в том же духе:

```json
{
  "type": "context-values",
  "target": "context-id",
  "payload": [
    { "key": "draft", "value": "Новый текст" }
  ]
}
```

После этого `Context`:

1. валидирует значение через `zod`, если schema задана;
2. применяет изменение по пути;
3. публикует новые данные в `data$`.

## Как это выглядит в transport-коде

Для `WS` transport обычно вообще не важно, что именно внутри сообщения:

```ts
socket.on("message", (raw: Buffer) => {
  client.newMessage(raw.toString());
});

client.attachTransport((message) => {
  socket.send(JSON.stringify(message));
});

socket.on("close", () => {
  client.detachTransport();
  app.clientDisconnect$.next(client);
});
```

Transport лишь перевозит JSON, а парсинг и dispatch уже происходят внутри matreshka. Прикладной код по-прежнему пишет в `outcomingMessage$`, а `attachTransport` / `detachTransport` управляют фактической доставкой в сокет.

## Минимальная карта message flow

1. Клиент отправляет `handshake` с `applicationId`.
2. BFF отправляет `handshake` с token и settings.
3. Клиент отправляет `client-state`.
4. BFF отправляет `page`.
5. При работе страницы клиент отправляет component messages и context updates.
6. BFF отвечает `context-values`, platform messages или новыми entry-компонентами.

## Что полезно помнить

- `target` — ключ адресации для context, component instance и platform actions (только у targeted-сообщений).
- Для **component commands** (BFF→client): `target` = instance id доставляет команду одному инстансу; базовый id (без суффикса `-N`) — всем инстансам одного server-`Component`. Подробнее — [`../advanced/component-instance.md`](../advanced/component-instance.md).
- Один и тот же transport подходит для любых message types.
- Если вы пишете собственный transport или runtime, протокол важнее клиентской реализации.

## Что читать дальше

- [`message-delivery.md`](message-delivery.md) — чтобы разобраться с подтверждениями получения, retry и RTT поверх базового протокола.
- [`../advanced/component-instance.md`](../advanced/component-instance.md) — подробнее про instance id и component commands.
- [`../guides/storage.md`](../guides/storage.md) — чтобы подробнее разобрать клиентское storage из `client-state`.
