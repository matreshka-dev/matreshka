# Первое приложение

**Цель:** один route, одна страница и подключение клиента в браузере через WebSocket.

**Предпосылки:** [Локальная настройка](local-setup.md) выполнена.

## 1. Экземпляр приложения

```ts
import { Matreshka, bootCore } from "@matreshka/bff/core";
import { bootServerComponents } from "@matreshka/bff/components";

export const app = new Matreshka();

bootCore(app);
bootServerComponents(app);
```

- `bootCore` — разбор входящих сообщений от клиента.
- `bootServerComponents` — реакция на `client-state` и отправка страницы по route.

## 2. Страница

```ts
import { Page, text } from "@matreshka/bff/components";

export class HomePage extends Page {
  protected title() {
    return "Главная";
  }

  protected content() {
    return [text("Привет из Matreshka BFF")];
  }
}
```

## 3. Route

```ts
import { app } from "./matreshka-instance";
import { HomePage } from "./pages/home-page";

app.router.addPage("/", async () => new HomePage());
```

## 4. Client settings (минимум)

```ts
import type { ClientSettings } from "@matreshka/bff/core/types/client-settings";

export const clientSettings: ClientSettings = {
  appName: "Demo",
  fonts: {
    base: {
      family: "Inter",
      fallbacks: ["sans-serif"],
      weights: [400, 500, 700],
    },
  },
  colors: [],
};

/** BFF может обслуживать несколько applicationId — верните настройки по id клиента. */
export function resolveClientSettings(_applicationId: string): ClientSettings {
  return clientSettings;
}
```

Подробнее о полях — [Client settings](../reference/client-settings.md).

## 5. WebSocket transport

```ts
import { WebSocketServer } from "ws";
import { app } from "./matreshka-instance";
import { resolveClientSettings } from "./client-settings";

const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (socket, req) => {
  const query = req.url?.includes("?") ? req.url.split("?")[1] : "";
  const params = new URLSearchParams(query);
  const client = app.getClient(params);

  socket.on("message", (message: Buffer) => {
    client.newMessage(message.toString());
  });

  client.attachTransport((message) => {
    socket.send(JSON.stringify(message));
  });

  socket.on("close", () => {
    client.detachTransport();
    app.clientDisconnect$.next(client);
  });

  app.initClient(client, params, resolveClientSettings);
});
```

Цикл:

1. `getClient(params)` — клиент по token (reconnect) или новый.
2. `newMessage` — входящие сообщения в BFF.
3. `attachTransport` — отправка ответов в сокет.
4. `initClient` — handshake и lifecycle (с resolver настроек по `applicationId`).

SSE, reconnect и детали протокола — [Эксплуатация](../architecture/operations.md), не обязательны для первого экрана.

## 6. Проверка

1. Запустите процесс с WebSocket на `3001`.
2. Запустите клиент (`ng serve`, конфиг `ws://127.0.0.1:3001`).
3. Откройте `http://localhost:4200` — должна появиться строка «Привет из Matreshka BFF».

Если transport и route настроены, **страница уходит автоматически** после того, как клиент сообщит текущий route в `client-state`.

## Ожидаемый результат

Работающая связка «клиент ↔ BFF» и одна серверная страница на `/`.

## Что дальше

- [Состояние и события](state-and-events.md) — форма и клики.
- [Роутинг](../guides/routing.md) — параметры и guards.
- [Рецепты](../recipes/cookbook.md) — короткие задачи по одной.
