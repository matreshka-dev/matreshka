---
name: platform-action
description: >-
  Добавляет или меняет платформенные команды Matreshka (BFF Platform → client):
  hot Observable, targeted ack, ErrorMessage. Use when adding platform methods,
  BffToClient platform messages, runPlatformAction on client, targetedClientPlatformAction,
  BLE scan stream, navigate/back/reload semantics.
---

# Platform-action (Matreshka)

При добавлении **новых платформенных команд** руководствуйся правилом: **команда на BFF всегда возвращает hot `Observable`**; **в общем случае клиент обязан сообщить серверу о завершении или об ошибке (текстом)**. Бывают **исключения**, когда успех/ошибку можно определить на стороне BFF без targeted-ack с клиента.

Подробнее: `docs/architecture/platform-actions.md`, API — `docs/reference/platforms.md`.

## Базовый контракт (default)

1. **BFF** — публичный метод платформы → **`Observable<T>`**, запрос уходит **при вызове** (hot), не при подписке.
2. **Wire** — исходящее сообщение с уникальным **`target`** (`platform-action-<uuid>` или отдельный session target для длинных сессий, см. BLE).
3. **Клиент** — все ответы с **тем же `target`**, что у исходной команды. Два типичных режима:
   - **One-shot** — после выполнения ровно **одно terminal-сообщение**: типизированный success с payload (`MobileGetGeolocationSuccessMessage`, …), либо `ActionCompletedMessage` (`action-completed`), либо `ErrorMessage` с **`payload.message`** (текст ошибки/отмены).
   - **Поток** (например `requestBLEScan`) — **много** промежуточных сообщений с тем же `target` (`MobileBleReceiveMessage`, …); observable на BFF эмитит `next` на каждое. **Завершение** потока: `ErrorMessage`, `ActionCompletedMessage`, `Client.destroy$`, или teardown на BFF (отписка всех observers → stop, как `MobileStopMessage` для BLE).
4. **Shared** — зарегистрировать новые типы в registry; не ломать сгенерированные файлы.

### BFF: one-shot

```ts
return targetedClientPlatformAction(this.client, {
  outgoingMessage: (scope) => new MyPlatformMessage(scope, payload),
  parseSuccess: (msg) => {
    if (msg instanceof MySuccessMessage) return schema.parse(msg.payload);
  },
  parseFailure: (msg) => {
    /* опционально: отмена UI → Error */
  },
});
```

Файл: `bff/platforms/utils/targeted-client-platform-action.ts`.

### BFF: поток (много элементов, один target)

```ts
return targetedClientPlatformStream(this.client, {
  outgoingMessage: (scope) => new MyStreamStartMessage(scope, config),
  parseItem: (msg) => { /* next */ },
  onTeardown: (scope, client) => { /* stop на клиенте */ },
});
```

Файл: `bff/platforms/utils/targeted-client-platform-stream.ts`. Teardown также при `Client.destroy$` и terminal-сообщениях.

### Client

- **One-shot**: `runPlatformAction(target, async () => { ... })` в `client/src/app/platforms/platform.ts` (ack/error через `ActionCompletedMessage`); или success-сообщение с **`message.target`** вместо `ActionCompletedMessage`.
- **Поток**: отдельный обработчик (как `requestBleScan`) — шлёшь элементы на `message.target`, ошибку — `ErrorMessage`; stop по входящему сообщению с тем же target (например `MobileStopMessage`).
- Не завершать сценарий молча: без terminal/error BFF не узнает об исходе (для one-shot) или не закроет stream.

## Исключения (завершение без классического client ack)

| Сценарий | Как завершается Observable на BFF |
| -------- | --------------------------------- |
| **`reload()`** | `AppReloadMessage` без target; успех — первый `Client.reconnect$` (`client-reload-platform-action.ts`). До reload клиент не может ack. |
| **`navigate()` / `back()`** | Сообщения без targeted ack; BFF ждёт смену route + доставку page (`client-navigate-platform-action.ts`, `client-back-platform-action.ts`, `client-route-page-wait.ts`). |
| **Длинная BLE-сессия** | Connect/disconnect/read — targeted action; неожиданный обрыв — отдельный `disconnectNotifyTarget` + `MobileBleDisconnectMessage`. |
| **Синхронное API без клиента** | Не platform-action: `getOverlays()` (снимок на BFF), `initData()` (разбор handshake на BFF). Observable не нужен. |

Новое исключение — только с явным обоснованием в коде и в `docs/architecture/platform-actions.md`.

## Чеклист новой команды

- [ ] `shared`: BffToClient (обычно `PingableTargetedBffToClientMessage`) + при необходимости ClientToBff success; register.
- [ ] `bff/platforms/*`: метод → hot `Observable`; утилита action/stream, не «fire-and-forget» в методе платформы.
- [ ] `client/src/app/platforms/*`: обработчик входящего типа + ack/error по target.
- [ ] Документация: `docs/reference/platforms.md` (+ `platform-actions.md`, если новая семантика завершения).
- [ ] Формат/линт затронутых пакетов (`AGENTS.md`).

## Антипаттерны

- Void-метод с `client.outcomingMessage$.next(...)` без Observable и без документированного исключения.
- Колбэки `(err, result) => void` в публичном API платформы BFF.
- Разные `target` у запроса и ответа.
- Клиент выполнил UI/API, но не отправил terminal/error (one-shot) или не шлёт элементы/ошибку в stream.
