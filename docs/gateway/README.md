# Gateway

`@matreshka/gateway` — прослойка между клиентами Matreshka и BFF-серверами. Она не привязана к WebSocket или SSE: можно подключить любой транспорт для клиентов. Связь gateway ↔ BFF пока тоже не зафиксирована — в пакете есть только логика жизненного цикла через `connectBff` и `BffConnection`.

Клиент и BFF по-прежнему обмениваются **тем же протоколом matreshka** (`handshake`, `client-state`, `page` и т.д.). Gateway только выбирает, на какой BFF отправить клиента (по `applicationId` из первого сообщения), а дальше просто пересылает JSON-строки туда и обратно, не разбирая их содержимое.

## Участники

| Участник                           | Роль                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Клиент** (Angular / Capacitor)   | Подключается к gateway по WebSocket или SSE. Шлёт и получает обычные сообщения matreshka.                               |
| **Gateway** (`@matreshka/gateway`) | Принимает клиентов, проверяет BFF по токену, направляет сессии на нужный BFF, хранит токены для повторного подключения. |
| **BFF** (`@matreshka/bff`)         | Регистрируется в gateway через `connectBff` и получает `BffConnection` с потоками жизненного цикла сессий.              |

## Схема подключений

```
┌─────────────┐   протокол matreshka   ┌─────────────┐   BffConnection    ┌─────────────┐
│   Клиент    │ ◄────────────────────► │   Gateway   │ ◄────────────────► │     BFF     │
│  (браузер)  │      :3002 (пример)    │  (пересылка)│  (пока in-process) │  (процесс)  │
└─────────────┘                        └─────────────┘                    └─────────────┘
```

На стороне BFF уже есть `Matreshka.connectGateway()` для WebSocket к gateway; полный production-shaped сервер gateway↔BFF в пакете ещё развивается. In-process сценарий: BFF регистрируется через `connectBff` и получает потоки (`clientOpened$`, `incomingFromClients$` и т.д.).

## Что gateway разбирает сам

Gateway понимает только несколько вещей:

1. **Client handshake** — читает `applicationId` и выбирает BFF из конфигурации.
2. **BFF handshake** — читает client `token` для повторного подключения и сохраняет в реестре.
3. **Проверка BFF** — токен вида `{числовойId}:{секрет}` и версия пакета `@matreshka/bff`.

Всё остальное (`client-state`, `page`, контексты, события компонентов) gateway **не трогает** — пересылает как есть.

## Служебные сообщения gateway ↔ BFF

Типы для будущего транспорта — как у client ↔ BFF, в `@matreshka/shared/messages/gateway-to-bff` и `bff-to-gateway`:

| Класс                 | type             | Направление   |
| --------------------- | ---------------- | ------------- |
| `ConnectedMessage`    | `connected`      | gateway → BFF |
| `SessionOpenMessage`  | `session-open`   | gateway → BFF |
| `ClientMessage`       | `client-message` | gateway → BFF |
| `SessionCloseMessage` | `session-close`  | gateway → BFF |
| `ErrorMessage`        | `error`          | gateway → BFF |
| `BffMessage`          | `bff-message`    | BFF → gateway |

Парсинг и сериализация:

```ts
import {
  ConnectedMessage,
  parseGatewayToBffMessage,
} from "@matreshka/shared/messages/gateway-to-bff";
import { registerGatewayMessages } from "@matreshka/shared/messages/register-gateway-messages";

registerGatewayMessages();

const connected = new ConnectedMessage({
  bffId: "1",
  applicationIds: ["localhost:4200"],
});
const message = parseGatewayToBffMessage(connected.toJSON());
```

Формат как у client ↔ BFF для служебных сообщений: `{ type, payload }` без `target`. In-process `BffConnection` использует те же события через RxJS; JSON-классы понадобятся, когда транспорт между процессами будет реализован.

## Основные методы

Главный класс — `Gateway` из `@matreshka/gateway`.

### Конфигурация BFF

```ts
const gateway = new Gateway({
  bffServers: [
    {
      id: "1",
      secret: "dev-secret",
      applicationIds: ["localhost:4200", "127.0.0.1:4200"],
    },
  ],
});
```

- `id` + `secret` — части BFF-токена (`1:dev-secret`).
- `applicationIds` — для каких приложений этот BFF. Если не указано, берётся `APPLICATION_ID_MAP`.

Конфигурацию можно менять без перезапуска: `addBffServerConfig`, `updateBffServerConfig`, `removeBffServerConfig`.

### Подключение BFF

```ts
const result = gateway.connectBff({
  token: "1:dev-secret",
  version: "0.9.0",
});

if (result.ok) {
  const bff = result.bff;
  // bff.linkedClients
  // bff.incomingFromClients$ → { client, message }
  // bff.clientOpened$ → { client, reconnectToken? }
  // bff.sendToClient(client, message)
}
```

`BffConnection` — класс активного BFF: знает своих клиентов через `linkedClients`, получает события с инстансами `ClientConnection`.

### Подключение клиентов (код transport-адаптера)

Обычно это WebSocket-сервер в процессе gateway:

```ts
const client = gateway.connectClient({
  reconnectToken: params.get("token") ?? undefined,
});

client.outgoingToClient$.subscribe((raw) => socket.send(raw));

socket.on("message", (data) => {
  client.handleMessage(data.toString());
});

socket.on("close", () => {
  client.close();
});
```

После client handshake `client.bff` указывает на связанный `BffConnection`.

### Потоки для наблюдения

- `activeBffs$` — список подключённых BFF.
- `clientSessionCount$` — сколько клиентских сессий открыто сейчас.

## Клиент: ничего менять не нужно

Для Matreshka-клиента gateway **как будто не существует**. Клиент по-прежнему:

1. открывает WebSocket (или SSE) по URL из конфигурации;
2. при новом подключении шлёт `handshake` с `applicationId`;
3. получает BFF `handshake`, затем шлёт `client-state`, получает `page` и дальше работает как обычно;
4. при повторном подключении передаёт `?token=...` в URL и не шлёт client handshake снова.

**Единственное изменение** — в конфиге клиента URL указывает на gateway, а не на BFF:

```json
{
  "url": "ws://127.0.0.1:3002"
}
```

Код Angular, обработчики сообщений и логика handshake менять не нужно. Протокол matreshka тот же — см. [`../architecture/protocol.md`](../architecture/protocol.md).

## Документы раздела

- [`lifecycle.md`](lifecycle.md) — как живут клиентская сессия и подключение BFF.
- [`bff-integration.md`](bff-integration.md) — как подключить BFF, примеры, локальный запуск.
