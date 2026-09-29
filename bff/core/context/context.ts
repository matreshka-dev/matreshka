import {
  ContextValuesMessage as BffToClientContextValuesMessage,
  ContextDestroyMessage,
  ContextInitMessage,
} from "@matreshka/shared/messages/bff-to-client/context/index";
import {
  ContextInitMessage as ClientToBffContextInitMessage,
  ContextValuesMessage as ClientToBffContextValuesMessage,
} from "@matreshka/shared/messages/client-to-bff/context/index";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import { JsonObject } from "@matreshka/shared/types/json";
import { fetchFromObject } from "@matreshka/shared/utils/fetch-from-object";
import { BehaviorSubject, filter, ReplaySubject, Subscription } from "rxjs";
import { Paths, PathValue } from "ts-essentials";
import { z, ZodObject } from "zod/v4";
import type { Client } from "../client";
import { currentClient } from "../client-context";
import { zodDeepPick } from "../utils/deep-pick";
import { incomingMessageObserver } from "../utils/incoming-message-observer";
import { objectsDiff } from "../utils/objects-diff";
import { replaceContextKeys } from "../utils/replace-context-keys";
import { setObjectProperty } from "../utils/set-object-property";
import { ContextRef } from "./context-ref";

type ContextClientBinding = {
  /** Клиенту уже отправляли ContextInitMessage */
  initSent: boolean;
};

type ContextRegistryEntry = {
  context: Context<any>;
  clients: Map<Client, ContextClientBinding>;
};

/** Глобальный реестр контекстов: lookup по id, привязки к клиентам, учёт init. */
const contextRegistry = new Map<string, ContextRegistryEntry>();

function registerContext(context: Context<any>) {
  contextRegistry.set(context.id, {
    context,
    clients: new Map(),
  });
}

function unregisterContext(contextId: string) {
  contextRegistry.delete(contextId);
}

function getContextById(contextId: string): Context<any> | undefined {
  return contextRegistry.get(contextId)?.context;
}

function getRegistryEntry(contextId: string) {
  return contextRegistry.get(contextId);
}

function bindClient(context: Context<any>, client: Client): boolean {
  const entry = contextRegistry.get(context.id);
  if (!entry || entry.clients.has(client)) {
    return false;
  }
  entry.clients.set(client, { initSent: false });
  return true;
}

function markInitSent(contextId: string, client: Client) {
  const binding = contextRegistry.get(contextId)?.clients.get(client);
  if (binding) {
    binding.initSent = true;
  }
}

function isInitSent(contextId: string, client: Client) {
  return contextRegistry.get(contextId)?.clients.get(client)?.initSent ?? false;
}

function unbindClient(contextId: string, client: Client) {
  const entry = contextRegistry.get(contextId);
  if (!entry) {
    return false;
  }
  entry.clients.delete(client);
  return entry.clients.size === 0;
}
/**
 * Контекст данных, связанных с клиентом.
 *
 * Используется для хранения и синхронизации состояния между сервером и клиентом,
 * а также для отслеживания ошибок валидации и управления реактивными изменениями.
 *
 * @template T Тип структуры данных контекста.
 */
export class Context<T extends JsonObject> {
  /** Уникальный идентификатор контекста */
  readonly id = crypto.randomUUID();
  /** Реактивное хранилище данных контекста. */
  data$?: BehaviorSubject<T>;
  /** Схема валидации данных контекста */
  readonly schema?: ZodObject;
  /** Флаг, указывающий, что контекст должен быть инициализирован при авторизации клиента */
  readonly preload: boolean;
  /** Реактивное хранилище инициализации контекста */
  private _init$ = new ReplaySubject<void>(1);
  readonly init$ = this._init$.asObservable();
  /**
   * Отслеживает, было ли изменение данных инициировано клиентом.
   * Если да — синхронизация с клиентом не требуется.
   */
  private dataChangedByClient?: Client;

  private initDataCallback?: () => Promise<T>;
  private initPromise?: Promise<this>;
  private initializing = false;
  private destroyed = false;
  private subscriptions = new Subscription();
  private dataSubscription?: Subscription;

  private assertNotDestroyed() {
    if (this.destroyed) {
      throw new Error(`Context ${this.id} has been destroyed`);
    }
  }

  /** Ошибка загрузки initDataCallback — в error$ всех клиентов, привязанных к контексту. */
  private reportInitFailureToClients(error: unknown) {
    getRegistryEntry(this.id)?.clients.forEach((_, client) => {
      client.error$.next(error);
    });
  }

  /**
   * Создаёт экземпляр контекста, привязанный к конкретному клиенту.
   *
   * Подписывается на входящие сообщения от клиента и ошибки, связанные с этим контекстом.
  
   */
  constructor(config: {
    data: () => Promise<T>;
    schema?: ZodObject;
    preload?: boolean;
  }) {
    this.schema = config.schema;
    registerContext(this);
    this.initDataCallback = config.data;
    this.preload = config.preload ?? false;
  }

  /** `data$` создан (init мог ещё выполняться — см. {@link init}). */
  inited() {
    return !!this.data$;
  }

  /** Данные загружены: `initDataCallback` завершился. */
  private isInitComplete() {
    return !!this.data$ && !this.initializing;
  }

  /** Контекст уничтожен и больше не может использоваться. */
  isDestroyed() {
    return this.destroyed;
  }

  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    getRegistryEntry(this.id)?.clients.forEach((_, client) => {
      client.outcomingMessage$.next(new ContextDestroyMessage(this.id));
    });

    this.subscriptions.unsubscribe();
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = undefined;

    this.data$?.complete();
    this.data$ = undefined;
    this.initializing = false;
    this.initPromise = undefined;
    this.dataChangedByClient = undefined;

    this.initDataCallback = undefined;
    this._init$.complete();
    unregisterContext(this.id);
  }

  private sendContextInit(client: Client) {
    if (this.destroyed || !this.data$) {
      return;
    }
    client.outcomingMessage$.next(
      new ContextInitMessage(this.id, structuredClone(this.data$.getValue())),
    );
  }

  authorizeClient(client: Client) {
    this.assertNotDestroyed();
    if (!bindClient(this, client)) {
      return;
    }
    if (this.preload) {
      void this.init().then(() => {
        if (this.destroyed) {
          return;
        }
        this.sendContextInit(client);
        markInitSent(this.id, client);
      });
    }
    this.subscriptions.add(
      client.destroy$.subscribe(() => {
        if (this.destroyed) {
          return;
        }
        client.outcomingMessage$.next(new ContextDestroyMessage(this.id));
        if (unbindClient(this.id, client)) {
          this.destroy();
        }
      }),
    );
    this.subscriptions.add(
      client.incomingMessage$
        .pipe(
          filter(
            (unsafeMessage) =>
              isTargetedMessage(unsafeMessage) &&
              unsafeMessage.target === this.id,
          ),
        )
        .subscribe(
          incomingMessageObserver(client, (unsafeMessage) => {
            if (this.destroyed) {
              return;
            }
            if (unsafeMessage instanceof ClientToBffContextInitMessage) {
              void this.init().then(() => {
                if (this.destroyed) {
                  return;
                }
                this.sendContextInit(client);
                if (!isInitSent(this.id, client)) {
                  markInitSent(this.id, client);
                }
              });
              return;
            }
            if (unsafeMessage instanceof ClientToBffContextValuesMessage) {
              const payloadSchema = z.array(
                z.strictObject({ key: z.string(), value: z.unknown() }),
              );
              const changes = payloadSchema.parse(unsafeMessage.payload);
              const data = this.data$!.getValue();
              changes.forEach((change) => {
                if (this.schema) {
                  const keySchema = zodDeepPick(this.schema, change.key);
                  keySchema.parse(change.value);
                }
                // @ts-expect-error Проверка типа происходит при помощи zod, так что ошибка не актуальна
                setObjectProperty(data, change.key, change.value);
              });
              this.dataChangedByClient = client;
              this.data$!.next(data);
              return;
            }
          }),
        ),
    );
  }

  protected subscribeToDataChanges() {
    let prevData: T; // pairwise() из rxjs имеет сцефику, если в next передать измененный объект, то prev и active совпадут, поэтому лучше хранить копию самому

    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.data$!.subscribe((data) => {
      if (this.destroyed) {
        return;
      }
      // Во время init() не шлём diff (сохраняем текущую семантику: первая "реальная" установка данных не должна рассылаться как изменения).
      if (!this.initializing && prevData) {
        let diff: Record<string, unknown> | undefined;
        getRegistryEntry(this.id)?.clients.forEach((_, client) => {
          if (this.dataChangedByClient !== client) {
            // Не первое присваивание
            // Сравнение двух объектов, поиск измененных ключей
            if (diff === undefined) {
              diff = objectsDiff(prevData, data);
            }
            if (Object.keys(diff).length) {
              // Изменения есть
              client.outcomingMessage$.next(
                new BffToClientContextValuesMessage(
                  this.id,
                  Object.entries(diff).map(([key, value]) => ({
                    key,
                    value,
                  })),
                ),
              );
            }
          }
        });
      }
      this.dataChangedByClient = undefined;
      prevData = structuredClone(data);
    });
  }

  /**
   * Инициализирует контекст: создаёт `data$`, загружает начальные данные через
   * `initDataCallback` и запускает синхронизацию с клиентами.
   *
   * Повторные вызовы безопасны: параллельные `init()` ждут один и тот же promise.
   *
   * Семантика ошибок:
   * - `await context.init()` — reject при сбое загрузки (для `boot()`, диалогов).
   * - `void context.init()` — reject не уходит в unhandledRejection; ошибка в `client.error$`.
   * - `destroy()` во время async-загрузки — тихий выход, без throw (ожидаемая гонка).
   *
   * @returns Текущий экземпляр контекста (resolve) или reject при ошибке загрузки.
   */
  async init() {
    // Контекст уже уничтожен — не бросаем, чтобы fire-and-forget init() после
    // закрытия диалога не давал unhandledRejection.
    if (this.destroyed) {
      return this;
    }

    // Сначала ждём уже запущенный init (в т.ч. void context.init() в конструкторе диалога).
    // Нельзя проверять inited() раньше initPromise: data$ появляется с {} до await initDataCallback().
    if (this.initPromise) return this.initPromise;
    if (this.isInitComplete()) return this;

    // Базовый promise загрузки. Отдельно от initPromise, чтобы развести:
    // - обработку ошибок для await-вызовов;
    // - подавление unhandledRejection для void-вызовов.
    const loading = (async () => {
      if (this.destroyed) {
        return this;
      }

      // data$ создаём синхронно до await, чтобы не было окна data$ === undefined
      // (например, при сериализации компонента во время init()).
      this.initializing = true;
      this.data$ = new BehaviorSubject({} as T);

      this.subscribeToDataChanges();

      const initialData = await this.initDataCallback!();

      // Диалог/страница могли закрыться, пока ждали initDataCallback — не применяем данные.
      if (this.destroyed) {
        return this;
      }

      this.data$.next(initialData);
      this.initializing = false;

      this._init$.next();
      return this;
    })();

    // Первая «страховка»: гасим reject у loading для void context.init().
    void loading.catch(() => {});

    this.initPromise = loading.catch((e) => {
      // Сбрасываем promise, чтобы следующий init() мог повторить попытку.
      this.initPromise = undefined;

      // destroy() во время загрузки — не считаем ошибкой.
      if (this.destroyed) {
        return this;
      }

      this.reportInitFailureToClients(e);
      throw e;
    });

    // Вторая «страховка»: initPromise re-throw'ит ошибку для await context.init(),
    // но для void-вызова reject не должен становиться unhandled.
    void this.initPromise.catch(() => {});

    return this.initPromise;
  }

  /**
   * Возвращает значение из контекста по указанному пути.
   *
   * Путь может содержать плейсхолдеры, которые будут заменены актуальными значениями.
   *
   * @param path Строка с путём до значения.
   * @returns Значение по заданному пути или undefined.
   */
  value<K extends Paths<T>>(path: K): PathValue<T, K>;
  value(path: string): unknown {
    this.assertNotDestroyed();
    return fetchFromObject(
      this.data$!.getValue(),
      replaceContextKeys(path, getContextById) as Paths<T>,
    );
  }

  setValue<K extends Paths<T>>(path: K, value: PathValue<T, K>) {
    this.assertNotDestroyed();
    const data = this.data$!.getValue();
    setObjectProperty(data, path, value);
    this.data$!.next(data);
  }

  /**
   * После мутаций объекта из `data$!.getValue()` in-place без вызовов `next()`
   * подписчики и клиенты не получают обновление. Метод публикует в поток глубокую
   * копию текущего состояния и запускает обычную цепочку (diff → сообщения клиенту).
   */
  emitAfterInPlaceMutation() {
    this.assertNotDestroyed();
    if (!this.data$) {
      return;
    }
    this.data$.next(structuredClone(this.data$.getValue()));
  }

  /**

   * @param path Путь до значения.
   * @returns Плейсхолдер для использования в шаблонах и компонентах.
   */
  ref<K extends Paths<T>>(path: K): ContextRef<T, K> {
    this.assertNotDestroyed();
    return new ContextRef<T, K>(this, path);
  }

  /**
   * Ссылка на значение в **этом** контексте по пути, который задаётся **во втором**
   * контексте строкой и меняется во времени.
   *
   * В отличие от прямого чтения `other.value()` при создании ссылки, в путь записывается
   * только плейсхолдер `@{<id контекста other>.<путь other>}` (см. `ContextRef.toString`).
   * При каждом обращении `Context.value` подставляет актуальное значение поля `other`;
   * это уже строка-путь относительно корня текущего контекста (например `cards.1.balance`).
   *
   * Типичный случай: во втором контексте хранится полный или частичный dotted-путь в данных
   * этого контекста; после мутации того поля одна и та же ссылка `strictRef` продолжает работать.
   *
   * Пример: `cardsContext` с данными `{ cards: [{ balance: 100 }, { balance: 200 }] }`;
   * во втором контексте `{ path: "cards.1.balance" }`. Вызов
   * `cardsContext.strictRef(pathContext.ref("path"))` при чтении даёт `200`.
   *
   * Для суффикса к фиксированному префиксу в этом же контексте используйте
   * `this.ref("…").strictRef(other)`.
   *
   * @experimental
   */
  strictRef<
    OtherContextType extends JsonObject,
    OtherPathType extends Paths<OtherContextType>,
  >(
    other: ContextRef<OtherContextType, OtherPathType>,
  ): ContextRef<T, PathValue<OtherContextType, OtherPathType> & Paths<T>> {
    this.assertNotDestroyed();
    const path = other.toString() as PathValue<
      OtherContextType,
      OtherPathType
    > &
      Paths<T>;
    return new ContextRef<
      T,
      PathValue<OtherContextType, OtherPathType> & Paths<T>
    >(this, path);
  }

  toJSON() {
    this.assertNotDestroyed();
    this.authorizeClient(currentClient());
    return this.id;
  }
}
