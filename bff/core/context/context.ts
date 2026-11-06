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
import { decContextValue } from "../actions/dec-context-value";
import { incContextValue, NumberValueRef } from "../actions/inc-context-value";
import {
  createSetContext,
  LocalContextPathPatch,
} from "../actions/set-context";
import {
  BooleanValueRef,
  toggleContextValue,
} from "../actions/toggle-context-value";
import type { Client } from "../client";
import { currentClient } from "../client-context";
import { ContextUpdateDelivery } from "../types/context-update-delivery";
import { ContextValueOrRef } from "../types/context-value-ref";
import { assertNonOverlappingContextPaths } from "../utils/assert-non-overlapping-context-paths";
import { assertSafeDottedPath } from "../utils/assert-safe-dotted-path";
import { zodDeepPick } from "../utils/deep-pick";
import { objectsDiff } from "../utils/objects-diff";
import { replaceContextKeys } from "../utils/replace-context-keys";
import { assertClientUpdateSchemaSupported } from "./assert-client-update-schema";
import { ContextRef } from "./context-ref";

export type { ContextUpdateDelivery } from "../types/context-update-delivery";

/** Частичное обновление данных контекста по dotted-путям (см. {@link Context.set}). */
export type ContextPathPatch<T extends JsonObject> = Partial<{
  [K in Paths<T>]: PathValue<T, K>;
}>;

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

type StripNullish<T> = Exclude<T, null | undefined>;

type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

/** `true`, если output допускает null/undefined как значение, а поле `T` — нет. */
type NullishValueMismatch<TField, IField> =
  | (null extends IField ? (null extends TField ? never : true) : never)
  | (undefined extends IField
      ? undefined extends TField
        ? never
        : true
      : never);

type FieldExtraSchemaKeysOne<TField, IField> = [StripNullish<IField>] extends [
  JsonObject,
]
  ? [StripNullish<TField>] extends [JsonObject]
    ? ExtraSchemaKeys<StripNullish<TField>, StripNullish<IField>>
    : never
  : [StripNullish<IField>] extends [readonly unknown[]]
    ? [StripNullish<TField>] extends [readonly unknown[]]
      ? ExtraSchemaKeys<
          ArrayElement<StripNullish<TField>>,
          ArrayElement<StripNullish<IField>>
        >
      : never
    : never;

/** Лишние ключи внутри поля (union, optional/nullable, массивы объектов). */
type FieldExtraSchemaKeys<TField, IField> = IField extends any
  ? FieldExtraSchemaKeysOne<TField, IField>
  : never;

/** Лишние ключи для одной пары object-веток (коррелированные поля). `true` — есть лишние ключи. */
type ExtraSchemaKeysObjectExact<
  T extends JsonObject,
  Input extends JsonObject,
> =
  Exclude<keyof Input, keyof T> extends never
    ? {
        [K in keyof Input & keyof T]: FieldExtraSchemaKeys<T[K], Input[K]>;
      }[keyof Input & keyof T] extends never
      ? never
      : true
    : true;

/** Есть ветка `T`, для которой `Input` не содержит лишних ключей. */
type SomeExtraSchemaKeysBranchOk<
  T,
  Input extends JsonObject,
> = T extends JsonObject
  ? ExtraSchemaKeysObjectExact<T, Input> extends never
    ? true
    : never
  : never;

/**
 * Лишние ключи в shape схемы относительно `T` (рекурсивно).
 * Union в `Input` и `T` проверяется по отдельным веткам. `true` — есть лишние ключи.
 */
type ExtraSchemaKeys<T, Input> = Input extends JsonObject
  ? SomeExtraSchemaKeysBranchOk<T, Input> extends true
    ? never
    : true
  : never;

type FieldSchemaCompatibleOne<TField, IField> =
  NullishValueMismatch<TField, IField> extends never
    ? FieldSchemaCompatibleShape<TField, IField>
    : true;

type FieldSchemaCompatibleShape<TField, IField> = [
  StripNullish<IField>,
] extends [JsonObject]
  ? [StripNullish<TField>] extends [JsonObject]
    ? SchemaCompatible<StripNullish<TField>, StripNullish<IField>>
    : true
  : [StripNullish<IField>] extends [readonly unknown[]]
    ? [StripNullish<TField>] extends [readonly unknown[]]
      ? FieldSchemaCompatible<
          ArrayElement<StripNullish<TField>>,
          ArrayElement<StripNullish<IField>>
        >
      : true
    : [StripNullish<IField>] extends [StripNullish<TField>]
      ? never
      : true;

/** Совместимость типа поля с полем контекста (union на входе — по веткам). */
type FieldSchemaCompatible<TField, IField> = IField extends any
  ? FieldSchemaCompatibleOne<TField, IField>
  : never;

/** Совместимость для одной пары object-веток. `true` — несовместимость. */
type SchemaCompatibleObjectExact<
  T extends JsonObject,
  Input extends JsonObject,
> =
  Exclude<keyof Input, keyof T> extends never
    ? {
        [K in keyof Input & keyof T]: FieldSchemaCompatible<T[K], Input[K]>;
      }[keyof Input & keyof T] extends never
      ? never
      : true
    : true;

type SomeSchemaCompatibleBranchOk<
  T,
  Input extends JsonObject,
> = T extends JsonObject
  ? SchemaCompatibleObjectExact<T, Input> extends never
    ? true
    : never
  : never;

/**
 * Типы полей shape схемы совместимы с `T` (рекурсивно; для клиентской схемы — {@link z.output}).
 * Подмножество ключей на любой глубине; union — по веткам. `true` — несовместимость.
 */
type SchemaCompatible<T, Input> = Input extends JsonObject
  ? SomeSchemaCompatibleBranchOk<T, Input> extends true
    ? never
    : true
  : never;

/**
 * Zod-схема для {@link createContext}: без лишних ключей во {@link z.input} и {@link z.output}
 * ({@link ExtraSchemaKeys}, union по веткам); {@link z.output} совместим с `T`
 * ({@link SchemaCompatible}, вложенные подмножества). В контекст попадает output после `parse()`.
 */
export type ContextSchema<T extends JsonObject, S extends z.ZodObject> = [
  S,
] extends [ContextClientUpdatesForbiddenSchema]
  ? S
  : ExtraSchemaKeys<T, z.input<S>> extends never
    ? ExtraSchemaKeys<T, z.output<S>> extends never
      ? SchemaCompatible<T, z.output<S>> extends never
        ? S
        : never
      : never
    : never;

/** Конфиг {@link createContext} без клиентской Zod-схемы. */
export type ContextInitWithoutSchema<T extends JsonObject> = {
  data: () => Promise<T>;
  schema?: undefined;
  preload?: boolean;
  persistent?: boolean;
};

/** Конфиг {@link createContext} с Zod-схемой клиентских изменений. */
export type ContextInitWithSchema<
  T extends JsonObject,
  S extends z.ZodObject,
> = {
  data: () => Promise<T>;
  schema: ContextSchema<T, S>;
  preload?: boolean;
  persistent?: boolean;
};

/** Конфигурация {@link createContext} (единственный аргумент). */
export type ContextInitConfig<
  T extends JsonObject,
  S extends z.ZodObject | undefined = undefined,
> = S extends z.ZodObject
  ? ContextInitWithSchema<T, S>
  : ContextInitWithoutSchema<T>;

/** Минимальная форма аргумента {@link createContext}. */
type ContextInitShape = {
  data: () => Promise<JsonObject>;
  schema?: z.ZodObject;
  preload?: boolean;
  persistent?: boolean;
};

type ContextRuntimeInit<T extends JsonObject> = {
  data: () => Promise<T>;

  schema?: z.ZodObject;

  preload?: boolean;

  persistent?: boolean;
};

/** Тип данных `T` из поля `data` конфига. */
export type ContextDataFromInit<C extends ContextInitShape> = Awaited<
  ReturnType<C["data"]>
>;

/** Zod-схема из поля `schema` конфига (или `undefined`). */
export type ContextSchemaFromInit<C extends ContextInitShape> = C extends {
  schema: z.ZodObject;
}
  ? C["schema"]
  : undefined;

/** Экземпляр {@link Context} по форме конфига {@link createContext}. */
export type ContextFromInit<C extends ContextInitShape> = Context<
  ContextDataFromInit<C>
>;

type ValidatedContextInit<C extends ContextInitShape> = ContextInitConfig<
  ContextDataFromInit<C>,
  ContextSchemaFromInit<C> extends z.ZodObject
    ? ContextSchemaFromInit<C>
    : undefined
>;

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
export class Context<T extends JsonObject> {
  /** Уникальный идентификатор контекста */
  readonly id = crypto.randomUUID();
  /** Реактивное хранилище данных контекста. */
  protected data$?: BehaviorSubject<T>;
  /** Схема валидации данных контекста */
  readonly schema?: z.ZodObject;
  /** Флаг, указывающий, что контекст должен быть инициализирован при авторизации клиента */
  readonly preload: boolean;
  /**
   * Не вызывать {@link destroy} автоматически при отвязке последнего клиента.
   * Явный {@link destroy} по-прежнему обязателен, если данные не нужны весь runtime.
   */
  readonly persistent: boolean;
  /** Локальные (client-only) действия над данными этого контекста. */
  readonly local = {
    set: (patch: LocalContextPathPatch<T>, config?: ActionConfig) =>
      createSetContext(this, patch, config),
    toggle: <K extends Paths<T>>(
      path: PathValue<T, K> extends boolean | undefined ? K : never,
      config?: ActionConfig,
    ) => toggleContextValue(this.ref(path) as BooleanValueRef, config),
    inc: <K extends Paths<T>>(
      path: PathValue<T, K> extends number | undefined ? K : never,
      step?: ContextValueOrRef<number>,
      config?: ActionConfig,
    ) => incContextValue(this.ref(path) as NumberValueRef, step ?? 1, config),
    dec: <K extends Paths<T>>(
      path: PathValue<T, K> extends number | undefined ? K : never,
      step?: ContextValueOrRef<number>,
      config?: ActionConfig,
    ) => decContextValue(this.ref(path) as NumberValueRef, step ?? 1, config),
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
   * Создаёт экземпляр контекста, привязанный к конкретному клиенту.
   *
   * Подписывается на входящие сообщения от клиента и ошибки, связанные с этим контекстом.
  
   */
  constructor(config: ContextRuntimeInit<T>) {
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
   * через {@link set}, {@link replace} и т.п.
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
  ref<K extends Paths<T>>(path: K): ContextRef<T, K> {
    this.assertNotDestroyed();
    return new ContextRef<T, K>(this, path);
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

/** Любой зарегистрированный контекст (с Zod-схемой или без). */
export type AnyContext = Context<any>;

/**
 * Создаёт контекст данных BFF: хранилище состояния с синхронизацией клиент ↔ сервер.
 *
 * Тип данных выводится из `data`, тип Zod-схемы — из `schema`. Связь проверяется через
 * {@link ContextSchema}. Generic-параметры у вызова не задаются.
 *
 * Если в начальном `data` нет части полей (например опциональных), укажите тип на колбэке:
 * `data: async (): Promise<MyT> => ({ … })`.
 */
export function createContext<C extends ContextInitShape>(
  config: C & ValidatedContextInit<C>,
): ContextFromInit<C> {
  return new Context(config);
}
