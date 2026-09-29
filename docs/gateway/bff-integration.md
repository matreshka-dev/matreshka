# Интеграция BFF с gateway

На текущем этапе BFF **регистрируется в gateway** через `connectBff` и получает `BffConnection` — объект с потоками жизненного цикла клиентских сессий.

Для удалённого gateway BFF может вызывать `Matreshka.connectGateway()` (WebSocket к gateway). Полный in-process сценарий ниже — через `connectBff` и `BffConnection`; transport gateway↔BFF между процессами в пакете ещё развивается.

## Минимальный пример

```ts
import { Gateway } from "@matreshka/gateway";

const gateway = new Gateway({
  bffServers: [
    { id: "1", secret: "dev-secret", applicationIds: ["localhost:4200"] },
  ],
});

const result = gateway.connectBff({
  token: "1:dev-secret",
  version: "0.9.0",
});

if (!result.ok) {
  throw new Error(result.error);
}

const bff = result.bff;
// bff.linkedClients
// bff.incomingFromClients$ → { client, message }
// bff.clientOpened$ → { client, reconnectToken? }
// bff.sendToClient(client, message)
```

## Что даёт `BffConnection`

| Поток / метод                   | Когда срабатывает                            |
| ------------------------------- | -------------------------------------------- |
| `linkedClients`                 | Текущие клиентские сессии, привязанные к BFF |
| `clientOpened$`                 | Клиент подключился или переподключился       |
| `incomingFromClients$`          | Сообщение от клиента (`{ client, message }`) |
| `clientClosed$`                 | Клиент отключился                            |
| `disconnect$`                   | BFF отключён от gateway                      |
| `sendToClient(client, message)` | Отправить сообщение клиенту                  |

Подробнее — в [`lifecycle.md`](lifecycle.md).

## Настройка процесса gateway

```ts
import { Gateway } from "@matreshka/gateway";
import { WebSocketServer } from "ws";

const gateway = new Gateway({
  bffServers: [
    {
      id: "1",
      secret: "dev-secret",
      applicationIds: ["localhost:4200", "127.0.0.1:4200"],
    },
  ],
});

gateway.connectBff({ token: "1:dev-secret", version: "0.9.0" });

const clientWss = new WebSocketServer({ port: 3002 });
clientWss.on("connection", (socket, req) => {
  const params = new URLSearchParams(req.url?.split("?")[1] ?? "");
  const client = gateway.connectClient({
    reconnectToken: params.get("token") ?? undefined,
  });

  const sub = client.outgoingToClient$.subscribe((raw) => socket.send(raw));
  socket.on("message", (m) => client.handleMessage(m.toString()));
  socket.on("close", () => {
    sub.unsubscribe();
    client.close();
  });
});
```

## Несколько BFF

Gateway направляет клиентов по `applicationId` из client handshake:

```ts
const gateway = new Gateway({
  bffServers: [
    { id: "1", secret: "secret-one", applicationIds: ["app-a.example.com"] },
    { id: "2", secret: "secret-two", applicationIds: ["app-b.example.com"] },
  ],
});
```

Каждый процесс BFF вызывает `connectBff` со своим токеном (`1:secret-one`, `2:secret-two`).

Добавить BFF без перезапуска:

```ts
gateway.addBffServerConfig({
  id: "3",
  secret: "secret-three",
  applicationIds: ["staging.example.com"],
});
```
