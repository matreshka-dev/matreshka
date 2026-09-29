# Жизненный цикл сессий

У gateway два независимых цикла: **клиент ↔ gateway** и **BFF ↔ gateway**. Клиентскую сессию открывает transport-адаптер (например WebSocket). BFF регистрируется через `connectBff` и получает `BffConnection` с потоками событий.

## BFF регистрируется в gateway

```mermaid
sequenceDiagram
  participant BFF
  participant Gateway

  BFF->>Gateway: connectBff({ token, version })
  Gateway->>Gateway: проверка токена и секрета
  alt проверка прошла
    Gateway->>BFF: BffConnection
    Note over BFF,Gateway: BFF подписывается на потоки сессий
  else проверка не прошла
    Gateway->>BFF: { ok: false, error }
  end

  loop пока BFF подключён
    Gateway->>BFF: clientOpened$ / incomingFromClients$ / clientClosed$
    BFF->>Gateway: sendToClient(sessionId, message)
  end

  BFF->>Gateway: disconnectBff(bffId) или повторный connectBff
  Gateway->>Gateway: закрыть сессии клиентов этого BFF
```

### Этапы

1. **Регистрация** — BFF вызывает `gateway.connectBff({ token, version })`.
2. **Проверка** — gateway сверяет токен с `bffServers` в конфиге.
3. **BffConnection** — gateway возвращает объект с потоками и `sendToClient`.
4. **Пересылка** — gateway публикует события клиентских сессий в потоки BFF.
5. **Отключение** — `disconnectBff` или повторный `connectBff` с тем же id закрывает предыдущее подключение и все его клиентские сессии.

## Новый клиент

```mermaid
sequenceDiagram
  participant Client
  participant Gateway
  participant BFF

  Client->>Gateway: WebSocket
  Gateway->>Gateway: connectClient()

  Client->>Gateway: handshake { applicationId }
  Gateway->>Gateway: выбор BFF по applicationId
  Gateway->>BFF: clientOpened$ { client }
  Gateway->>BFF: incomingFromClients$ { sessionId, handshake }

  BFF->>BFF: getClient → attachTransport → initClient
  BFF->>Gateway: sendToClient(sessionId, bff handshake)
  Gateway->>Gateway: сохранить token клиента в реестре
  Gateway->>Client: bff handshake

  Client->>Gateway: client-state
  Gateway->>BFF: incomingFromClients$
  BFF->>Gateway: sendToClient (page, context, …)
  Gateway->>Client: без изменений

  Note over Client,BFF: дальше gateway только пересылает строки
```

### Этапы

1. **Подключение** — transport-адаптер вызывает `gateway.connectClient()`.
2. **Client handshake** — первое сообщение клиента; gateway читает `applicationId` и привязывает сессию к BFF.
3. **Session open** — gateway публикует событие в `clientOpened$`.
4. **Инициализация BFF** — BFF создаёт `Client`, подключает transport через `sendToClient` и вызывает `initClient`.
5. **BFF handshake** — gateway сохраняет client `token` из BFF handshake для повторного подключения.
6. **Пересылка** — все следующие сообщения идут через `incomingFromClients$` / `sendToClient`.

Если для `applicationId` нет подключённого BFF, gateway закрывает клиентскую сессию.

## Повторное подключение клиента

```mermaid
sequenceDiagram
  participant Client
  participant Gateway
  participant BFF

  Client->>Gateway: WebSocket ?token=client-token-123
  Gateway->>Gateway: connectClient({ reconnectToken })
  Gateway->>Gateway: поиск BFF в реестре токенов
  Gateway->>BFF: clientOpened$ { client, reconnectToken }
  Gateway->>BFF: (client handshake не пересылается)

  BFF->>BFF: getClient({ token }) → attachTransport → initClient
  BFF->>Gateway: sendToClient (app-reconnect-info или app-reload)
  Gateway->>Client: без изменений

  Note over Client,BFF: client handshake не шлётся — как при прямом BFF
```

### Отличия от новой сессии

- Client `token` передаётся в URL (`?token=...`).
- Gateway сразу находит BFF по реестру токенов.
- Client handshake **не** отправляется — как при прямом подключении к BFF (см. [`../architecture/protocol.md`](../architecture/protocol.md#handshake)).
- BFF получает `reconnectToken` в `clientOpened$` и передаёт его в `getClient(params)`.

## Клиент отключается

```mermaid
sequenceDiagram
  participant Client
  participant Gateway
  participant BFF

  Client-xGateway: WebSocket закрыт
  Gateway->>Gateway: client.close()
  Gateway->>BFF: clientClosed$ { client }
  BFF->>BFF: detachTransport, clientDisconnect$

  Note over Gateway: token клиента удаляется из реестра
```

При закрытии WebSocket клиента transport-адаптер обязан вызвать `client.close()` на `ClientConnection`, полученном из `connectClient`.

## Сводная таблица

| Событие | Кто инициирует | Что делает gateway |
|---------|----------------|-------------------|
| WebSocket клиента открыт | Клиент | `connectClient` |
| Client handshake | Клиент | Выбор BFF по `applicationId`, `clientOpened$`, пересылка |
| Сообщение клиента | Клиент | `incomingFromClients$` → BFF |
| Ответ BFF | BFF | `sendToClient` → клиент; при BFF handshake — сохранение token |
| WebSocket клиента закрыт | Клиент | `clientClosed$` → BFF, очистка реестра |
| BFF отключён | BFF / gateway | `disconnectBff`, закрытие всех его сессий |
| Повторное подключение | Клиент | Поиск BFF по token, `clientOpened$` с `reconnectToken` |
