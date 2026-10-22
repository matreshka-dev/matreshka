---
name: component-action
description: >-
  Добавляет или меняет imperative-команды BFF-компонентов (map, stack, text-editor,
  dialog close и т.д.): hot Observable, actionScope, ActionCompletedMessage.
  Use when adding component command methods, PingableComponentCommandMessage,
  dispatchComponentCommand, runComponentCommand on client.
---

# Component-action (Matreshka)

Публичные методы BFF-компонентов, которые **шлют команду на клиент** (`map.setCenter`, `stack.scrollTo`, `dialog.close`, команды text-editor, …), — **component-action**: hot **`Observable<void>`** на BFF и **обязательный ack** с клиента.

Не путать с **reliable sync** (`ForEachSyncComponentsMessage`, `NestedItemsSyncMessage`) — это синхронизация состояния без component-action ack.

Подробнее: `docs/architecture/component-actions.md`, instance id — `docs/advanced/component-instance.md`, API компонентов — `docs/reference/components-list.md`. Общий terminal ack — см. `.cursor/skills/platform-action/SKILL.md` (`ActionCompletedMessage`).

## Базовый контракт

1. **BFF** — метод компонента → **`Observable<void>`** (hot); отправка при вызове, не при подписке.
2. **Wire (BFF→client)** — `PingableComponentCommandMessage` (`payload` extends **`ComponentCommandActionPayload`**):
   - **`target`** — instance id (адресация + RTT ping);
   - **`payload.actionScope`** — `component-action-<uuid>` (correlation для ack); **обязателен**.
3. **Wire (client→BFF)** — terminal с **`target === actionScope`**:
   - успех без payload — `ActionCompletedMessage` (`action-completed`);
   - ошибка — `ErrorMessage` с `payload.message`.
4. **Shared** — payload extends `ComponentCommandActionPayload` (compile-time); register; на клиенте/BFF после parse — `instanceof PingableComponentCommandMessage`.

### BFF: dispatch из класса Component

```ts
setCenter(center: MapSetCenterPayload, instances?: ComponentInstance[]) {
  return this.dispatchComponentCommand(
    instances,
    (target, actionScope) =>
      new MapSetCenterMessage(target, { ...center, actionScope }),
  );
}
```

- Без `instances` — все `this.instances` с `client`; с `instances` — только переданные.
- Несколько instances → `forkJoin` observables.
- Нет подключённых clients → `of(undefined)` (сразу complete).

Файлы: `bff/components/component.ts` (`dispatchComponentCommand`), `bff/components/utils/targeted-client-component-action.ts`, общая логика ack — `bff/core/utils/targeted-client-action.ts`.

### Client

```ts
this.componentCommandMessages$.subscribe((message) => {
  if (message instanceof MapSetCenterMessage) {
    this.runComponentCommand(message, () => {
      /* выполнить команду */
    });
  }
});
```

- `runComponentCommand` — `ServerComponent`, внутри `runTargetedAction(postman, message.actionScope, action)`.
- Утилиты: `client/src/app/utils/targeted-action.ts`.
- **Завершение action** = момент, когда UI/API реально отработали (не раньше):
  - async — `await` в action (`camera.switchToCamera`);
  - smooth scroll — `waitForElementScrollEnd`;
  - dialog/popover close — после `destroyed$` (`waitForPopupDestroyed`).

Фильтр входящих: `componentCommandMessages$` (по `target` / `componentIdMatchesInstance`).

## Чеклист новой команды

- [ ] `shared/messages/bff-to-client/components/...`: класс extends `PingableComponentCommandMessage`, `actionScope` в конструкторе; register.
- [ ] `bff/components/*.ts`: публичный метод → `return this.dispatchComponentCommand(...)`, не `broadcast` / `outcomingMessage$.next` без Observable.
- [ ] `client/.../server/**/*.component.ts`: ветка в `componentCommandMessages$` + `runComponentCommand`.
- [ ] `docs/reference/components-list.md` (+ `component-actions.md` при новой семантике завершения).
- [ ] Формат/линт затронутых пакетов (`AGENTS.md`).

## Антипаттерны

- Void / `return this` без `Observable` для imperative-команды на клиент.
- `broadcast()` или прямой `outcomingMessage$.next` для pingable-команды из публичного API.
- Использовать `target` instance id как correlation ack (ack только по **`actionScope`**).
- Клиент выполнил команду, но не отправил `ActionCompletedMessage` / `ErrorMessage`.
- Добавлять component-action ack к `ReliableComponentCommandMessage` sync без явного запроса.

## Связь с platform-action

| | Platform | Component |
| --- | --- | --- |
| Correlation | `target` = `platform-action-<uuid>` | `actionScope` = `component-action-<uuid>` |
| Адресация команды | `target` на BffToClient | `target` = instance id |
| BFF helper | `targetedClientPlatformAction` | `targetedClientComponentAction` / `dispatchComponentCommand` |
| Client helper | `runPlatformAction` | `runComponentCommand` |
| Terminal success | `ActionCompletedMessage` | то же |
