# Component-action: команды компоненту с ack

Публичные методы BFF-компонентов (`map.setCenter`, `stack.scrollTo`, `dialog.close`, команды text-editor и т.д.) — **targeted actions**: BFF инициирует работу на клиенте и получает сигнал о завершении или ошибке.

См. также [platform-actions.md](platform-actions.md) — тот же terminal-тип ack и hot `Observable` на BFF.

## Принцип

1. BFF вызывает метод компонента → hot **`Observable<void>`** (запрос уходит при вызове).
2. На wire: `PingableComponentCommandMessage` с **`target`** = instance id; **`payload.actionScope`** = `component-action-<uuid>` (correlation id). Базовый тип payload — `ComponentCommandActionPayload` (может расширяться полями команды).
3. Клиент выполняет команду в `runComponentCommand` и отвечает с **тем же** `actionScope`:
   - успех без данных — [`ActionCompletedMessage`](../shared/messages/client-to-bff/action-completed-message.ts) (`action-completed`);
   - ошибка — `ErrorMessage` с текстом.

Reliable sync (`ForEachSyncComponentsMessage`, `NestedItemsSyncMessage`) — отдельный контракт без component-action ack.

## BFF

- [`dispatchComponentCommand`](../../bff/components/component.ts) — одно исходящее сообщение на каждый instance с клиентом; несколько instances → `forkJoin`.
- [`targetedClientComponentAction`](../../bff/components/utils/targeted-client-component-action.ts) — ожидание terminal-сообщения по scope.

## Client

- [`runComponentCommand`](../../client/src/app/components/server/server-component.ts) + [`runTargetedAction`](../../client/src/app/utils/targeted-action.ts).

## Локальные component actions

Для команд, которым не нужен round-trip на BFF, компоненты предоставляют `local` API:

```ts
button({
  onClick: ({ instance }) =>
    map.local.setZoom(12),
});
```

`component.local.*` сериализует базовый id компонента и выполняет действие на всех его instances. У каждого `ComponentInstance` есть проксированный `instance.local.*`; он сериализует конкретный `instance.id` и выполняет действие только на этом instance:

```ts
onClick: ({ instance }) => instance.component.local.zoomIn();
onClick: ({ instance }) => instance.local.zoomIn();
```

Локальные команды являются обычными `LocalAction` в `interactions`: клиент находит target через `ComponentHubService` и вызывает DOM/API без сообщения BFF и без ack. Параметры локальных команд совпадают с соответствующими серверными командами; у локального метода дополнительно может быть `ActionConfig` с conditions.
