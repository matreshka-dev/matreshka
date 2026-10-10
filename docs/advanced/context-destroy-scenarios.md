# Сценарии уничтожения Context в приложении

Документ для BFF-разработки **после** [Context (guide)](../guides/context.md): когда вызывать `context.destroy()`, как разделять entry-, client- и component-scoped контексты, типовые шаблоны кода.

Протокол `context-destroy`, holds и `pendingDestroy` на клиенте — в [Жизненный цикл Context](../architecture/context-lifecycle.md). Эксплуатационные ограничения памяти — в [operations.md](../architecture/operations.md).

## Зачем вызывать `destroy()`

Каждый `Context` на BFF занимает память процесса: объект данных, подписки на `Client`, запись в registry, синхронизация с браузером. **Когда состояние больше не нужно, его нужно явно завершать** вызовом `context.destroy()` (если контекст ещё не уничтожен — проверяйте `context.isDestroyed()`).

Что делает `destroy()`:

- помечает контекст недоступным для `value()`, `setValue` и сериализации ref;
- завершает `data$` и снимает подписки на BFF;
- шлёт клиентам **`context-destroy`**;
- удаляет контекст из registry (освобождение памяти на сервере).

На клиенте локальная копия снимается отдельно — по **holds** в `ComponentHub`, когда UI больше не ссылается на id.

## Когда destroy обязателен, а когда нет

| Сценарий | Область жизни | Нужен `destroy()` от приложения? |
| -------- | ------------- | -------------------------------- |
| Контекст **страницы или диалога** | Пока открыт entry (маршрут / модалка) | **Да** — при `stopUsing$` entry |
| **Сессионный** контекст на `Client` | Пока жив WebSocket-клиент (корзина, шапка, профиль) | **Нет** при каждом уходе со страницы; **да** при выходе из приложения / смене учётки |
| **Вспомогательный** контекст **своего** BFF-компонента | Пока компонент на BFF в использовании (`stopUsing$`) | **Да** — `destroy()` вместе с компонентом |
| Отключение последнего клиента (default) | Нет привязок к id | **Автоматически** — registry вызывает `destroy()` |
| **Process-wide** кэш на BFF (`persistent: true`) | Весь runtime или до явной инвалидации | **Критично** — ручной `destroy()`, если не нужен весь runtime; auto при last client **выключен** |

## Default vs `persistent`

**Default (`persistent: false`):**

- После отвязки **последнего** клиента BFF **всегда** уничтожает контекст. «Вечного» хранения без клиентов не будет.
- Ручной `destroy()` по entry / logout / component lifecycle — **оптимизация по времени**: освободить память **раньше**, пока другой клиент ещё мог бы держать тот же id (редко для page-scoped).

**Persistent (`persistent: true`):**

- Контекст **переживает** период без привязанных клиентов; данные остаются в registry до **`context.destroy()`**.
- Если бизнес **не** требует жить весь runtime — **обязательно** спланируйте явный destroy (reload, версия, shutdown). Без этого — утечка на BFF.
- Не путать с **client-scoped** (`WeakMap<Client, Context>`): там память растёт с числом клиентов; persistent — **один** id на процесс, общий для всех одновременных потребителей.

```ts
let catalogContext = new Context({
  persistent: true,
  preload: true,
  data: async () => loadCatalogOnce(),
});

export function invalidateCatalogContext() {
  catalogContext.destroy();
  catalogContext = new Context({
    persistent: true,
    preload: true,
    data: async () => loadCatalogOnce(),
  });
}
```

Важно: **навигация внутри одной сессии не уничтожает контексты сами по себе**. Пользователь ушёл со страницы, но `Client` на BFF жив — entry-scoped контекст без `destroy()` продолжит висеть в памяти и держать подписки.

Память BFF масштабируется с **числом живых контекстов на активных клиентов**, а не с «сколько раз открыли страницу».

## 1. Контекст entry (Page / Dialog)

Состояние формы, списка, деталки — только пока открыт экран. Стандартный паттерн — подписаться на **`stopUsing$`** entry (снято последнее client-instance страницы или диалога) и вызвать `destroy()`:

```ts
import type { Context } from "@matreshka/bff/core";
import type { JsonObject } from "@matreshka/shared/types/json";
import type { Observable } from "rxjs";

function destroyContextWithEntry<T extends JsonObject>(
  entry: { stopUsing$: Observable<void> },
  context: Context<T>,
): Context<T> {
  entry.stopUsing$.subscribe(() => {
    if (!context.isDestroyed()) {
      context.destroy();
    }
  });
  return context;
}

export class ProfilePage extends Page {
  context = destroyContextWithEntry(
    this,
    new Context({
      data: async () => ({ name: "Alice" }),
    }),
  );
}
```

Удобно вынести helper в проект (например, `destroyContextWithEntry`) и вызывать из базового класса страниц — метод вроде `entryContext(context)` на общем базовом `Page`, чтобы не дублировать подписку на `stopUsing$` в каждом диалоге.

Если диалог не открыли (контекст создали «про запас»), привязать его некому — вызовите `context.destroy()` вручную в ветке ошибки.

Долгие подписки на `data$` в entry завершайте через `takeUntil(this.destroy$)` или `takeUntil(entry.stopUsing$)` — см. [Context (guide)](../guides/context.md).

## 2. Сессионный (client-scoped) контекст

Данные **одни на всё приложение для данного пользователя**: корзина, счётчик уведомлений, выбранное пространство, глобальный поиск в shell. Один экземпляр `Context` на **`Client`**, кэш через `WeakMap<Client, Context>`:

```ts
import { Client, Context, currentClient } from "@matreshka/bff/core";

const CACHE = new WeakMap<Client, Context<{ unread: number }>>();

export function currentSessionContext(): Context<{ unread: number }> {
  const client = currentClient();
  let context = CACHE.get(client);
  if (context === undefined) {
    context = new Context({
      preload: true,
      data: async () => ({ unread: await loadUnread() }),
    });
    CACHE.set(client, context);
  }
  return context;
}

export function destroySessionContext(client: Client = currentClient()) {
  const context = CACHE.get(client);
  if (context === undefined) return;
  CACHE.delete(client);
  context.destroy();
}
```

Такой контекст **не уничтожают при каждой навигации** — иначе общие данные будут заново загружаться на каждой странице. Подписки на внешние источники обрывают по **`client.destroy$`** (конец сессии / grace period). Явный `destroySessionContext` — при logout или смене учётки.

Именованные фабрики `current…Context()` / `destroy…Context(client)` держат кэш согласованным с lifecycle сессии.

## 3. Вспомогательный client-scoped UI

Тот же один контекст на клиента, но **узкая область** — например, глобальная строка поиска в shell одного раздела приложения. Живёт, пока пользователь в этой зоне; при уходе с маршрута вызывают отдельный `destroy…Context()`, подписки — `takeUntil(client.destroy$)`. Удобно вызывать destroy из route guard или базовой страницы раздела при смене «корня» приложения.

Это не «общий контекст на всех пользователей сервера»: память всё равно **на каждого подключённого `Client`**, но **не растёт с каждым открытием страницы** внутри сессии.

## 4. Вспомогательный контекст в своём BFF-компоненте

Иногда одного page-контекста мало: переиспользуемый **свой** компонент держит техническое состояние отдельно от данных экрана — индексы для `strictRef`, локальный UI-state виджета, кэш промежуточных значений. Тогда внутри класса компонента создают **второй** `Context`, не видимый снаружи как «контекст страницы».

Типичный lifecycle:

- один экземпляр контекста на экземпляр BFF-компонента (поле класса);
- при сериализации для клиента — `authorizeClient(instance.client)` (или ref, который сам привяжет клиента), иначе `ContextRef` в props не синхронизируется;
- при **`stopUsing$`** компонента (сняты все client-instance этого компонента) — **`context.destroy()`**, если контекст больше никому не нужен.

```ts
export class MyListWidget extends Component {
  private readonly indexStore = new Context({
    preload: this.config.preload,
    data: async () => ({}),
  });

  constructor(config: MyListWidgetConfig) {
    super(config);
    void this.indexStore.init();
    this.stopUsing$.subscribe(() => {
      if (!this.indexStore.isDestroyed()) {
        this.indexStore.destroy();
      }
    });
  }

  serialize(instance: ComponentInstance<this>) {
    if (instance.client) {
      this.indexStore.authorizeClient(instance.client);
    }
    return super.serialize(instance);
  }
}
```

Данные предметной области по-прежнему лучше хранить в **entry-контексте** и уничтожать его по `stopUsing$` страницы; вспомогательный контекст живёт **короче** — только пока живёт компонент.

Встроенные `forEach` и `itemList` в Matreshka устроены так же (отдельный контекст индексов на компонент); при разработке своих списков и виджетов ориентируйтесь на тот же паттерн, а не на page-scoped `destroyContextWithEntry`.

## 5. Async после ухода со страницы

`ContextRef.setValue` после `destroy()` **молча игнорируется** — безопасно в `finally` после `await`. Прямой `context.setValue` на уничтоженном контексте на BFF бросает ошибку; в обработчиках после async проверяйте `isDestroyed()`.

## Связь с другими документами

- [Context (guide)](../guides/context.md) — `ref`, preload, подписки на `data$`
- [Жизненный цикл Context](../architecture/context-lifecycle.md) — BFF vs клиент, holds, антипаттерны teardown
- [Протокол](../architecture/protocol.md) — `context-init`, `context-values`, `context-destroy`
