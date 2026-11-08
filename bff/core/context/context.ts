import {
  ContextValuesMessage as BffToClientContextValuesMessage,
  ContextDestroyMessage,
  ContextInitMessage,
} from "@matreshka/client-bff-protocol/messages/bff-to-client/context/index";
import {
  ContextInitMessage as ClientToBffContextInitMessage,
  ContextValuesMessage as ClientToBffContextValuesMessage,
} from "@matreshka/client-bff-protocol/messages/client-to-bff/context/index";
import { TargetedMessage } from "@matreshka/client-bff-protocol/messages/targeted-message";
import { JsonObject } from "@matreshka/client-bff-protocol/types/json";
import { fetchFromObject } from "@matreshka/shared/utils/fetch-from-object";
import { setObjectProperty } from "@matreshka/shared/utils/set-object-property";
import {
  BehaviorSubject,
  catchError,
  concatMap,
  EMPTY,
  filter,
  from,
  Observable,
  ReplaySubject,
  Subject,
  Subscription,
  switchMap,
  take,
} from "rxjs";
import { Paths, PathValue } from "ts-essentials";
import { z } from "zod";
import { ActionConfig } from "../actions/action";
import { decContextValue, DecContextValue } from "../actions/dec-context-value";
import { incContextValue, IncContextValue } from "../actions/inc-context-value";
import {
  createSetContext,
  LocalContextPathPatch,
} from "../actions/set-context";
import {
  ToggleContextValue,
  toggleContextValue,
} from "../actions/toggle-context-value";
import type { Client } from "../client";
import { currentClient } from "../client-context";
import { ContextUpdateDelivery } from "../types/context-update-delivery";
import type {
  ValueOrContextRef,
  WritableContextRefOfValue,
} from "../types/context-value-ref";
import { assertNonOverlappingContextPaths } from "../utils/assert-non-overlapping-context-paths";
import { assertSafeDottedPath } from "../utils/assert-safe-dotted-path";
import { zodDeepPick } from "../utils/deep-pick";
import { objectsDiff } from "../utils/objects-diff";
import { replaceContextKeys } from "../utils/replace-context-keys";
import { assertClientUpdateSchemaSupported } from "./assert-client-update-schema";
import { ContextRef } from "./context-ref";

export type { ContextUpdateDelivery } from "../types/context-update-delivery";
export * from "./context-create";

/** Частичное обновление данных контекста по dotted-путям (см. {@link Context.set}). */
export type ContextPathPatch<T extends JsonObject> = Partial<{
  [K in Paths<T>]: PathValue<T, K>;
}>;

/** Входная форма данных, которые клиент может отправить в `context-values`. */
export type WritableSchemaInput<S extends z.ZodObject | undefined> =
  S extends z.ZodObject
    ? z.input<S> extends JsonObject
      ? z.input<S>
      : never
    : never;

/** Dotted-пути, разрешённые для клиентской записи (по `schema`). */
type IsAny<T> = 0 extends 1 & T ? true : false;

export type WritablePath<S extends z.ZodObject | undefined> =
  IsAny<S> extends true
    ? string
    : S extends z.ZodObject
      ? Paths<WritableSchemaInput<S>>
      : never;

/** Тип значения по writable-пути `P` (из `schema` input). */
export type WritablePathValue<
  S extends z.ZodObject | undefined,
  P extends string,
> =
  IsAny<S> extends true
    ? unknown
    : S extends z.ZodObject
      ? P extends Paths<WritableSchemaInput<S>>
        ? PathValue<WritableSchemaInput<S>, P>
        : never
      : never;

/** Пересечение путей контекста и путей `schema`, доступных для client write. */
export type WritableContextPath<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
> = Extract<Paths<T>, WritablePath<S>>;

/**
 * Пустая strict-схема: клиент не может менять данные контекста через `context-values`.
 * Используется во внутренних контекстах (ForEach, ItemList).
 */
export type ContextClientUpdatesForbiddenSchema = z.ZodObject<
  Record<string, never>,
  z.core.$strict
> & {
  readonly __contextClientUpdatesForbidden?: unique symbol;
};

/** @see ContextClientUpdatesForbiddenSchema */
export const contextClientUpdatesForbiddenSchema = z.strictObject(
  {},
) as ContextClientUpdatesForbiddenSchema;

type ContextRuntimeInit<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
> = {
  data: () => Promise<T>;

  schema?: S;

  preload?: boolean;

  persistent?: boolean;
};

/** Отделяет чтение через {@link Context.get} от живого дерева в хранилище. */
function cloneGetResult(value: unknown): unknown {
  if (value !== null && typeof value === "object") {
    return structuredClone(value);
  }
  return value;
}

type ContextClientBinding = {
  /** Клиенту уже отправляли ContextInitMessage */
  initSent: boolean;
};

type ContextRegistryEntry = {
  context: AnyContext;
  clients: Map<Client, ContextClientBinding>;
};

/** Глобальный реестр контекстов: lookup по id, привязки к клиентам, учёт init. */
const contextRegistry = new Map<string, ContextRegistryEntry>();

function registerContext(context: AnyContext) {
  contextRegistry.set(context.id, {
    context,
    clients: new Map(),
  });
}

function unregisterContext(contextId: string) {
  contextRegistry.delete(contextId);
}

function getContextById(contextId: string): AnyContext | undefined {
  return contextRegistry.get(contextId)?.context;
}

function getRegistryEntry(contextId: string) {
  return contextRegistry.get(contextId);
}

function bindClient(context: AnyContext, client: Client): boolean {
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

function isClientBound(contextId: string, client: Client): boolean {
  return getRegistryEntry(contextId)?.clients.has(client) ?? false;
}
/**
 * Контекст данных, связанных с клиентом.
 *
 * @internal Создавайте экземпляры через {@link createContext}.
 *
 * @template T Тип структуры данных контекста.
 *
 * Zod-схема клиентских изменений задаётся в {@link createContext} через поле `schema`,
 * а не вторым type-параметром: так проще согласовать runtime-схему и тип данных.
 */
export class Context<
  T extends JsonObject,
  S extends z.ZodObject | undefined = any,
> {
  /** Уникальный идентификатор контекста */
  readonly id = crypto.randomUUID();
  /** Реактивное хранилище данных контекста. */
  protected data$?: BehaviorSubject<T>;
  /** Схема валидации данных контекста */
  readonly schema?: S;
  /** Флаг, указывающий, что контекст должен быть инициализирован при авторизации клиента */
  readonly preload: boolean;
  /**
   * Не вызывать {@link destroy} автоматически при отвязке последнего клиента.
   * Явный {@link destroy} по-прежнему обязателен, если данные не нужны весь runtime.
   */
  readonly persistent: boolean;
  /** Локальные (client-only) действия над данными этого контекста. */
  readonly local = {
    set: (patch: LocalContextPathPatch<T, S>, config?: ActionConfig) =>
      createSetContext(this, patch, config),
    toggle: <K extends WritableContextPath<T, S>>(
      path: PathValue<T, K> extends boolean | undefined
        ? WritablePathValue<S, K> extends boolean | undefined
          ? K
          : never
        : never,
      config?: ActionConfig,
    ): ToggleContextValue =>
      toggleContextValue(
        this.ref(path as Paths<T>) as unknown as WritableContextRefOfValue<
          boolean | undefined
        >,
        config,
      ),
    inc: <K extends WritableContextPath<T, S>>(
      path: PathValue<T, K> extends number | undefined
        ? WritablePathValue<S, K> extends number | undefined
          ? K
          : never
        : never,
      step?: ValueOrContextRef<number>,
      config?: ActionConfig,
    ): IncContextValue =>
      incContextValue(
        this.ref(path as Paths<T>) as unknown as WritableContextRefOfValue<
          number | undefined
        >,
        step ?? 1,
        config,
      ),
    dec: <K extends WritableContextPath<T, S>>(
      path: PathValue<T, K> extends number | undefined
        ? WritablePathValue<S, K> extends number | undefined
          ? K
          : never
        : never,
      step?: ValueOrContextRef<number>,
      config?: ActionConfig,
    ): DecContextValue =>
      decContextValue(
        this.ref(path as Paths<T>) as unknown as WritableContextRefOfValue<
          number | undefined
        >,
        step ?? 1,
        config,
      ),
  };
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
  private clientSubscriptions = new Map<Client, Subscription>();
  /** Серверный set/replace уже сам отправил diff; в subscribeToDataChanges повторять не нужно. */
  private skipNextDataSync = false;
  /** Очередь входящих targeted-сообщений всех клиентов (последовательная обработка). */
  private incomingClientMessages$ = new Subject<{
    client: Client;
    message: TargetedMessage;
  }>();

  private assertNotDestroyed() {
    if (this.destroyed) {
      throw new Error(`Context ${this.id} has been destroyed`);
    }
  }

  private assertInitialized(): asserts this is this & {
    data$: BehaviorSubject<T>;
  } {
    if (!this.data$) {
      throw new Error(`Context ${this.id} is not initialized`);
    }
  }

  /**
   * Клиентское `context-values` разрешено только по ключам {@link schema}.
   * Нет схемы или ключ вне неё — `Error`, patch не применяется.
   * Валидация через {@link zodDeepPick}: output **конечного** поля (leaf transform/refine).
   * Transform/refine родительского object при dotted-patch не поддерживаются.
   */
  private async parseClientChange(
    key: string,
    value: unknown,
  ): Promise<unknown> {
    assertSafeDottedPath(key);

    if (!this.schema) {
      throw new Error(
        `Context ${this.id} rejected client update for "${key}": validation schema is not set`,
      );
    }

    let keySchema;
    try {
      keySchema = zodDeepPick(this.schema, key);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new Error(
        `Context ${this.id} rejected client update for "${key}": key is not described in the validation schema (${reason})`,
      );
    }

    return keySchema.parseAsync(value);
  }

  private async handleTargetedClientMessage(
    client: Client,
    unsafeMessage: TargetedMessage,
  ): Promise<void> {
    if (this.destroyed) {
      return;
    }
    if (unsafeMessage instanceof ClientToBffContextInitMessage) {
      await this.init();
      if (this.destroyed || !isClientBound(this.id, client)) {
        return;
      }
      this.sendContextInit(client);
      if (!isInitSent(this.id, client)) {
        markInitSent(this.id, client);
      }
      return;
    }
    if (unsafeMessage instanceof ClientToBffContextValuesMessage) {
      const payloadSchema = z.array(
        z.strictObject({ key: z.string(), value: z.unknown() }),
      );
      const changes = payloadSchema.parse(unsafeMessage.payload);
      assertNonOverlappingContextPaths(changes.map((change) => change.key));
      const patch: Partial<Record<string, unknown>> = {};
      for (const change of changes) {
        patch[change.key] = await this.parseClientChange(
          change.key,
          change.value,
        );
        if (this.destroyed || !isClientBound(this.id, client)) {
          return;
        }
      }
      if (this.destroyed || !isClientBound(this.id, client)) {
        return;
      }
      this.dataChangedByClient = client;
      this.set(patch as ContextPathPatch<T>);
    }
  }

  /** Ошибка загрузки initDataCallback — в error$ всех клиентов, привязанных к контексту. */
  private reportInitFailureToClients(error: unknown) {
    getRegistryEntry(this.id)?.clients.forEach((_, client) => {
      client.error$.next(error);
    });
  }

  /**
   * Фабричный runtime-вход для {@link createContext}.
   * Не используйте напрямую в прикладном коде — это обходит compile-time проверку schema↔data.
   *
   * @internal
   * @deprecated Internal API. Use createContext(...) instead.
   */
  static createRuntime<
    U extends JsonObject,
    SchemaType extends z.ZodObject | undefined,
  >(config: ContextRuntimeInit<U, SchemaType>): Context<U, SchemaType> {
    return new Context<U, SchemaType>(config);
  }

  /**
   * Создаёт экземпляр контекста, привязанный к конкретному клиенту.
   *
   * Подписывается на входящие сообщения от клиента и ошибки, связанные с этим контекстом.
  
   */
  protected constructor(config: ContextRuntimeInit<T, S>) {
    this.schema = config.schema;

    if (this.schema) {
      assertClientUpdateSchemaSupported(this.schema);
    }
    registerContext(this);
    this.initDataCallback = config.data;
    this.preload = config.preload ?? false;
    this.persistent = config.persistent ?? false;
    this.subscriptions.add(
      this.incomingClientMessages$
        .pipe(
          concatMap(({ client, message }) =>
            from(this.handleTargetedClientMessage(client, message)).pipe(
              catchError((error) => {
                client.error$.next(error);
                return EMPTY;
              }),
            ),
          ),
        )
        .subscribe(),
    );
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
    this.incomingClientMessages$.complete();

    getRegistryEntry(this.id)?.clients.forEach((_, client) => {
      client.outcomingMessage$.next(new ContextDestroyMessage(this.id));
    });

    for (const subscription of this.clientSubscriptions.values()) {
      subscription.unsubscribe();
    }
    this.clientSubscriptions.clear();

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

  private releaseClientBinding(client: Client) {
    this.clientSubscriptions.get(client)?.unsubscribe();
    this.clientSubscriptions.delete(client);
  }

  authorizeClient(client: Client) {
    this.assertNotDestroyed();
    if (!bindClient(this, client)) {
      return;
    }
    if (this.preload) {
      void this.init()
        .then(() => {
          if (this.destroyed || !isClientBound(this.id, client)) {
            return;
          }
          this.sendContextInit(client);
          markInitSent(this.id, client);
        })
        .catch(() => {});
    }
    const clientSubscription = new Subscription();
    this.clientSubscriptions.set(client, clientSubscription);
    clientSubscription.add(
      client.destroy$.subscribe(() => {
        if (this.destroyed) {
          return;
        }
        this.releaseClientBinding(client);
        const lastClientUnbound = unbindClient(this.id, client);
        if (lastClientUnbound && !this.persistent) {
          this.destroy();
        }
      }),
    );
    clientSubscription.add(
      client.incomingMessage$
        .pipe(
          filter(
            (unsafeMessage): unsafeMessage is TargetedMessage =>
              unsafeMessage instanceof TargetedMessage &&
              unsafeMessage.target === this.id,
          ),
        )
        .subscribe((unsafeMessage) => {
          this.incomingClientMessages$.next({
            client,
            message: unsafeMessage,
          });
        }),
    );
  }

  protected subscribeToDataChanges() {
    let prevData: T; // pairwise() из rxjs имеет сцефику, если в next передать измененный объект, то prev и active совпадут, поэтому лучше хранить копию самому

    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.data$!.subscribe((data) => {
      if (this.destroyed) {
        return;
      }
      if (this.skipNextDataSync) {
        this.skipNextDataSync = false;
        prevData = structuredClone(data);
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

  private completeImmediately(): Observable<ContextUpdateDelivery> {
    const result$ = new ReplaySubject<ContextUpdateDelivery>(1);
    result$.next({ delivered: [] });
    result$.complete();
    return result$.asObservable();
  }

  private recipientsForDiff(): Client[] {
    const recipients: Client[] = [];
    getRegistryEntry(this.id)?.clients.forEach((_, client) => {
      if (this.dataChangedByClient !== client) {
        recipients.push(client);
      }
    });
    return recipients;
  }

  private emitDiffAndWait(
    diff: Record<string, unknown>,
  ): Observable<ContextUpdateDelivery> {
    const recipients = this.recipientsForDiff();
    this.dataChangedByClient = undefined;
    if (Object.keys(diff).length === 0 || recipients.length === 0) {
      return this.completeImmediately();
    }

    const payload = Object.entries(diff).map(([key, value]) => ({
      key,
      value,
    }));
    const result$ = new ReplaySubject<ContextUpdateDelivery>(recipients.length);
    const delivered: Client[] = [];
    let finalized = false;
    const subscriptions = new Subscription();

    const finishError = (error: unknown) => {
      if (finalized) {
        return;
      }
      finalized = true;
      subscriptions.unsubscribe();
      result$.error(error);
    };

    const finishSuccess = (client: Client) => {
      if (finalized) {
        return;
      }
      delivered.push(client);
      result$.next({ delivered: [...delivered] });
      if (delivered.length === recipients.length) {
        finalized = true;
        subscriptions.unsubscribe();
        result$.complete();
      }
    };

    for (const client of recipients) {
      const message = new BffToClientContextValuesMessage(this.id, payload);
      subscriptions.add(
        client.waitForDelivery(message).subscribe({
          next: () => finishSuccess(client),
          error: (error) => finishError(error),
        }),
      );
      client.outcomingMessage$.next(message);
    }

    return result$.asObservable();
  }

  private updateDataAndWait(
    mutator: (currentData: T) => T,
  ): Observable<ContextUpdateDelivery> {
    this.assertNotDestroyed();
    this.assertInitialized();

    const currentData = this.data$.getValue();
    const prevData = structuredClone(currentData);
    const nextData = mutator(structuredClone(currentData));
    const diff = objectsDiff(prevData, nextData);

    this.skipNextDataSync = true;
    this.data$.next(nextData);

    return this.emitDiffAndWait(diff);
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
   * Объекты и массивы — **копия** ({@link structuredClone}); in-place мутация результата
   * не меняет контекст. Для снимка всего `T` — {@link snapshot}.
   *
   * @param path Строка с путём до значения.
   * @returns Значение по заданному пути или undefined.
   */
  get<K extends Paths<T>>(path: K): PathValue<T, K>;
  get(path: string): unknown {
    this.assertNotDestroyed();
    this.assertInitialized();
    const value = fetchFromObject(
      this.data$.getValue(),
      replaceContextKeys(path, getContextById) as Paths<T>,
    );
    return cloneGetResult(value);
  }

  /**
   * Частичное обновление данных по dotted-путям одним вызовом `next`.
   *
   * Предпочтительный способ правки нескольких полей на BFF. Ключ с явным
   * `undefined` применяется (отличие от отсутствующего ключа в patch).
   * Для целого снимка после load — {@link replace}.
   *
   * Возвращает hot {@link Observable}: на каждый receipt — {@link ContextUpdateDelivery}
   * с накопительным `delivered`; `complete` после всех адресатов. Пустой diff /
   * нет получателей — один `next({ delivered: [] })` и `complete`.
   * См. `docs/architecture/context-update-delivery.md`.
   */
  set(patch: ContextPathPatch<T>): Observable<ContextUpdateDelivery> {
    const paths = Object.keys(patch).filter((path) =>
      Object.prototype.hasOwnProperty.call(patch, path),
    );
    assertNonOverlappingContextPaths(paths);
    for (const path of paths) {
      assertSafeDottedPath(path);
    }
    return this.updateDataAndWait((data) => {
      for (const path of paths as Paths<T>[]) {
        setObjectProperty(data, path, patch[path] as PathValue<T, typeof path>);
      }
      return data;
    });
  }

  /**
   * Полная замена корня контекста (результат load, `{ ...loaded, field }`).
   *
   * Не merge patch: переданный объект становится новым состоянием целиком.
   * Возвращает тот же hot {@link Observable}, что и {@link set}.
   */
  replace(data: T): Observable<ContextUpdateDelivery> {
    return this.updateDataAndWait(() => structuredClone(data));
  }

  /**
   * Следующее состояние целиком из текущего снимка `T`.
   *
   * Callback получает копию текущих данных и возвращает значение того же типа.
   * Результат сохраняется как structured clone, как в {@link replace}.
   * Возвращает тот же hot {@link Observable}, что и {@link set}.
   */
  update(updater: (current: T) => T): Observable<ContextUpdateDelivery> {
    return this.updateDataAndWait((current) =>
      structuredClone(updater(current)),
    );
  }

  /**
   * Глубокая копия всего `T` (structured clone корня).
   *
   * Для одного поля — {@link get}. Нужен, когда на время async нужен отсоединённый
   * снимок всего состояния, а не ссылка на живые данные.
   */
  snapshot(): T {
    this.assertNotDestroyed();
    this.assertInitialized();
    return structuredClone(this.data$.getValue());
  }

  /**
   * Read-only поток данных контекста для подписок и RxJS-операторов.
   *
   * Если {@link init} ещё не создал хранилище, подписка **ждёт** успешного init
   * ({@link init$}), затем ведёт себя как после init. При {@link destroy} до init
   * поток завершается без эмиссий.
   *
   * После подключения сразу эмитит текущее состояние, затем каждое обновление
   * через {@link set}, {@link replace}, {@link update} и т.п.
   */
  watch(): Observable<T> {
    this.assertNotDestroyed();

    // asObservable() — без .next у подписчиков; тот же поток, что у внутреннего Subject.
    const connect = (): Observable<T> => {
      if (this.destroyed || !this.data$) {
        // destroy до init: init$ уже complete, подписчик не должен висеть.
        return EMPTY;
      }
      return this.data$.asObservable();
    };

    // init уже создал Subject (в т.ч. промежуточный `{}` во время await load).
    if (this.data$) {
      return connect();
    }

    // boot() до init(): ждём успешный init, затем обычные эмиссии BehaviorSubject.
    return this.init$.pipe(
      take(1),
      switchMap(() => connect()),
    );
  }

  /**

   * @param path Путь до значения.
   * @returns Плейсхолдер для использования в шаблонах и компонентах.
   */
  ref<K extends Paths<T>>(path: K): ContextRef<T, K, S> {
    this.assertNotDestroyed();
    return new ContextRef<T, K, S>(this, path);
  }

  /**
   * Ссылка на значение в **этом** контексте по пути, который задаётся **во втором**
   * контексте строкой и меняется во времени.
   *
   * В отличие от прямого чтения `other.get()` при создании ссылки, в путь записывается
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
    OtherSchemaType extends z.ZodObject | undefined,
    OtherPathType extends Paths<OtherContextType>,
  >(
    other: ContextRef<OtherContextType, OtherPathType, OtherSchemaType>,
  ): ContextRef<T, PathValue<OtherContextType, OtherPathType> & Paths<T>, S> {
    this.assertNotDestroyed();
    const path = other.toString() as PathValue<
      OtherContextType,
      OtherPathType
    > &
      Paths<T>;
    return new ContextRef<
      T,
      PathValue<OtherContextType, OtherPathType> & Paths<T>,
      S
    >(this, path);
  }

  toJSON() {
    this.assertNotDestroyed();
    this.authorizeClient(currentClient());
    return this.id;
  }
}

export type AnySchemaContext<T extends JsonObject = JsonObject> = Context<
  T,
  z.ZodObject | undefined
>;

/** Любой зарегистрированный контекст (с Zod-схемой или без). */
export type AnyContext = Context<any, any>;
