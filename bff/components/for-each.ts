import { ServerComponentClass } from "@matreshka/client-bff-protocol/enums/server-component-class";
import { ForEachSyncComponentsMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/components/for-each/for-each-sync-components-message";
import type {
  ForEachConfig,
  ForEachSyncComponentsPayload,
} from "@matreshka/client-bff-protocol/types/for-each-config";
import { BehaviorSubject, skip, Subscription } from "rxjs";
import { Paths, PathValue } from "ts-essentials";
import type { z } from "zod";
import {
  AnySchemaContextRef,
  calculateComponents,
  ComponentInstance,
  ComponentTreeNode,
  Context,
  contextClientUpdatesForbiddenSchema,
  ContextRef,
  ContextRefLocalActions,
  ContextRefValueType,
  JsonObject,
  runWithClient,
  runWithEntryContext,
  serializeComponentList,
  StandaloneComponent,
  WritableContextRefOfValue,
} from "../core";
import { runWithCreatedInstanceTracking } from "../core/utils/track-created-instances";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "./component";

type ForEachArrayValue = readonly unknown[] | unknown[];
type ForEachIndexContext = Record<string, { index: `${number}` }>;
type ForEachItemArray<RefType extends AnySchemaContextRef> = Extract<
  ContextRefValueType<RefType>,
  ForEachArrayValue
>;

export type CompatibleForEachRef<RefType extends AnySchemaContextRef> = [
  ForEachItemArray<RefType>,
] extends [never]
  ? never
  : RefType;

type ForEachItemData<RefType extends AnySchemaContextRef> =
  ForEachItemArray<RefType>[number];

type ForEachIsAny<T> = 0 extends 1 & T ? true : false;

/**
 * `local` item-ref: при известной schema — по ней (writable-пути), при `any`
 * (ref без привязки к schema) — по типу значения.
 */
type ForEachItemLocal<
  ContextType extends JsonObject,
  PathType extends string,
  SchemaType extends z.ZodObject | undefined,
  ValueType,
> =
  ForEachIsAny<SchemaType> extends true
    ? WritableContextRefOfValue<ValueType>["local"]
    : ContextRefLocalActions<ContextType, PathType, SchemaType>;

type ForEachTypedItemRef<
  ContextType extends JsonObject,
  PathType extends string,
  ValueType,
  SchemaType extends z.ZodObject | undefined = any,
> = Omit<AnySchemaContextRef, "context" | "path" | "ref" | "get" | "local"> & {
  readonly context: Context<ContextType>;
  readonly path: PathType;
  readonly __valueType?: ValueType;
  readonly local: ForEachItemLocal<
    ContextType,
    PathType,
    SchemaType,
    ValueType
  >;
  get(): ValueType;
  get(): JsonObject;
  ref<K extends Paths<ValueType>>(
    path: K,
  ): ForEachTypedItemRef<
    ContextType,
    `${PathType}.${K & string}`,
    PathValue<ValueType, K>,
    SchemaType
  >;
  ref<P2 extends string>(
    path: ContextRef<ContextType, P2>,
  ): ContextRef<ContextType, `${PathType}.${P2}`>;
};

type ForEachItemLink<RefType extends AnySchemaContextRef> =
  RefType extends ContextRef<
    infer ContextType,
    infer PathType,
    infer SchemaType
  >
    ? ForEachTypedItemRef<
        ContextType,
        `${PathType}.${number}`,
        ForEachItemData<RefType>,
        SchemaType
      >
    : never;

/** Уже отданный клиенту слот: повторно не сериализуется, instance id стабильны. */
type ForEachSerializedSlot = {
  components: ForEachSyncComponentsPayload["upserts"][number]["components"];
  instances: ComponentInstance[];
};

/** Кэш generator и отданных слотов, привязанные к одному instance ForEach. */
type ForEachInstanceState = {
  componentsCache: Map<string, ComponentTreeNode[]>;
  serializedByKey: Map<string, ForEachSerializedSlot>;
};

/** Возвращает массив элементов списка из ref; не-массив даёт пустой массив. */
function getForEachValue<RefType extends AnySchemaContextRef>(
  ref: RefType,
): ForEachItemData<RefType>[] {
  const rawValue = ref.get() as ForEachItemArray<RefType> | undefined;
  return Array.isArray(rawValue)
    ? (rawValue as ForEachItemData<RefType>[])
    : [];
}

/**
 * Связывает ref элемента списка с ref индекса в {@link ForEachContext},
 * чтобы генератор мог читать `ref.get()` и вложенные поля элемента.
 */
function createForEachItemLink<
  ContextType extends JsonObject,
  PathType extends string,
  RefType extends ContextRef<ContextType, PathType, any> & {
    get(): ForEachArrayValue | undefined;
  },
>(
  ref: RefType,
  indexRef: ContextRef<ForEachIndexContext, `${string}.index`, any>,
): ForEachItemLink<RefType> {
  return ref.strictRef(indexRef) as unknown as ForEachItemLink<RefType>;
}

/**
 * Свойства, передаваемые генератору компонентов в `ForEach`.
 *
 * @property component Компонент `ForEach`, инициирующий генерацию.
 * @property key Ключ контекста, в котором хранятся данные элемента.
 */
export type ForEachGeneratorProperties<
  RefType extends AnySchemaContextRef,
  ComponentType extends ComponentTreeNode = ComponentTreeNode,
> = {
  component: ForEach<RefType, ComponentType>;
  ref: ForEachItemLink<RefType>;
};

/**
 * Свойства компонента `ForEach`.
 *
 * @property ref Ссылка в контексте, по которой хранятся данные списка.
 */
export type ForEachProperties = {
  ref: ContextRef;
  componentContext: Context<any>;
  components?: (ComponentTreeNode | ComponentTreeNode[])[];
  divider?: ComponentTreeNode[];
} & ComponentProperties;

export const forEach = <
  RefType extends AnySchemaContextRef,
  ComponentType extends ComponentTreeNode = ComponentTreeNode,
  PropertiesType extends ForEachProperties = ForEachProperties,
>(
  config: ForEachInitConfig<RefType, ComponentType, PropertiesType>,
): ForEach<RefType, ComponentType, PropertiesType> => new ForEach(config);

/**
 * Конфигурация инициализации компонента `ForEach`.
 *
 * @property ref Ссылка в контексте, по которой хранятся данные списка.
 * @property track Функция, возвращающая уникальный идентификатор для каждого элемента данных.
 * @property preload Флаг, указывающий, что компонент должен генерировать компоненты при инициализации, ускоряет загрузку страницы, но увеличивает время загрузки и объем данных, к тому же данные могут измениться к моменту onShow из-за изменения контекста.
 * @property generator Функция, генерирующая компонент(ы) для каждого элемента данных.
 */
export type ForEachInitConfig<
  RefType extends AnySchemaContextRef,
  ComponentType extends ComponentTreeNode = ComponentTreeNode,
  PropertiesType extends ForEachProperties = ForEachProperties,
> = {
  ref: CompatibleForEachRef<RefType>;
  preload?: boolean;
  track: (data: ForEachItemData<RefType>) => string;
  generator: (
    properties: ForEachGeneratorProperties<RefType, ComponentType>,
  ) => ComponentType | ComponentType[];
  /** Разделитель между элементами списка (не после последнего). */
  divider?: ComponentTreeNode | ComponentTreeNode[];
} & ComponentInitConfig<ForEach<RefType, ComponentType>, PropertiesType>;

class ForEachContext<T extends JsonObject> extends Context<
  T,
  typeof contextClientUpdatesForbiddenSchema
> {
  /**
   * Синхронно поднимает хранилище до async {@link init} (preload-сериализация индексов).
   * @returns Тот же экземпляр контекста.
   */
  initSync() {
    if (this.inited()) {
      return this;
    }
    this.data$ = new BehaviorSubject({} as T);
    this.subscribeToDataChanges();
    return this;
  }

  /**
   * Контекст индексов элементов ForEach; данные не загружаются снаружи (`schema` пустой).
   *
   * @param preload Наследует флаг preload родительского контекста списка.
   */
  constructor(preload: boolean) {
    super({
      data: async () => ({}) as Promise<T>,
      preload: preload,
      schema: contextClientUpdatesForbiddenSchema, // Запрет изменения из внешних источников
    });
  }
}

/**
 * Компонент, отображающий список элементов путём генерации компонентов на основе массива данных.
 */
export class ForEach<
    RefType extends AnySchemaContextRef,
    ComponentType extends ComponentTreeNode = ComponentTreeNode,
    PropertiesType extends ForEachProperties = ForEachProperties,
  >
  extends Component<ForEachInitConfig<RefType, ComponentType>, PropertiesType>
  implements StandaloneComponent
{
  /** Включён ли preload: элементы сериализуются уже в первом ответе страницы. */
  private preload = false;
  /** Сколько раз ForEach в состоянии onShow (несколько instance на клиенте). */
  private instanceCount = 0;
  /** Подписка на контекст списка; снимается, когда все onShow завершились onHide. */
  private contextSubscription?: Subscription;
  /** Контекст индексов элементов (`id{track}` → `{ index }`). */
  private componentContext: ForEachContext<ForEachIndexContext>;
  /**
   * Состояние по каждому instance ForEach: свой кэш generator и instances дочерних компонентов.
   * Снятие одного instance ForEach не затрагивает другие entry/client.
   */
  private instanceStates = new Map<
    ComponentInstance<this>,
    ForEachInstanceState
  >();

  /** Контрольная сумма `track`-ключей с прошлой генерации; для пропуска лишнего sync. */
  private lastItemsCheckSum = "";

  /**
   * Возвращает уникальный идентификатор класса компонента.
   *
   * @returns Строка `"for-each"`.
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.ForEach;
  }

  /**
   * Возвращает флаг, указывающий, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Стабильный ключ элемента в кэше и в {@link ForEachContext}.
   *
   * @param item Элемент данных из ref списка.
   * @returns Ключ вида `id{track(item)}`.
   */
  private itemId(item: ForEachItemData<RefType>) {
    // Префикс id: при трекинге по числу strictRef не путает ключ с индексом массива.
    return "id" + this.config.track(item);
  }

  /**
   * Возвращает или создаёт состояние, привязанное к конкретному instance ForEach.
   *
   * @param forEachInstance Instance ForEach на клиенте (связка client + entry + id).
   */
  /** Ключ на wire: значение `track` без внутреннего префикса индексного контекста. */
  private trackKey(item: ForEachItemData<RefType>) {
    return this.config.track(item);
  }

  private getInstanceState(
    forEachInstance: ComponentInstance<this>,
  ): ForEachInstanceState {
    let state = this.instanceStates.get(forEachInstance);
    if (!state) {
      state = {
        componentsCache: new Map(),
        serializedByKey: new Map(),
      };
      this.instanceStates.set(forEachInstance, state);
    }
    return state;
  }

  /**
   * Снимает instances элементов списка и удаляет состояние для одного instance ForEach.
   *
   * @param forEachInstance Instance ForEach, инстанс которого прекращено.
   */
  private releaseInstanceState(forEachInstance: ComponentInstance<this>) {
    const state = this.instanceStates.get(forEachInstance);
    if (state) {
      for (const slot of state.serializedByKey.values()) {
        this.releaseTrackedInstances(slot.instances);
      }
    }
    this.instanceStates.delete(forEachInstance);
  }

  /** Снимает instances, созданные одной сериализацией слота. */
  private releaseTrackedInstances(instances: ComponentInstance[]) {
    if (instances.length === 0) {
      return;
    }
    const byComponent = new Map<Component, ComponentInstance[]>();
    for (const instance of instances) {
      const component = instance.component as Component;
      const list = byComponent.get(component) ?? [];
      list.push(instance);
      byComponent.set(component, list);
    }
    for (const [component, componentInstances] of byComponent) {
      component.releaseInstances(componentInstances);
    }
  }

  /**
   * Удаляет слоты, которых больше нет в массиве, и снимает только их instances.
   *
   * @param currentTrackKeys Актуальные значения `track`.
   * @param state Состояние одного instance ForEach.
   */
  private evictRemovedSlots(
    currentTrackKeys: Set<string>,
    state: ForEachInstanceState,
  ) {
    // Копия ключей: ниже удаляем записи прямо из Map.
    // Слот уже отдан клиенту — снимаем его instances и оба кэша.
    // Ключ дерева — `id` + track, как в {@link itemId}: так strictRef не путает его с индексом.
    for (const trackKey of [...state.serializedByKey.keys()]) {
      if (currentTrackKeys.has(trackKey)) {
        continue;
      }
      const slot = state.serializedByKey.get(trackKey);
      if (slot) {
        this.releaseTrackedInstances(slot.instances);
      }
      state.serializedByKey.delete(trackKey);
      state.componentsCache.delete("id" + trackKey);
    }
    // Дерево без сериализованного слота (generator успел отработать, serialize — нет).
    // slice(2) снимает префикс `id` и возвращает значение track.
    for (const itemId of [...state.componentsCache.keys()]) {
      if (!currentTrackKeys.has(itemId.slice(2))) {
        state.componentsCache.delete(itemId);
      }
    }
  }

  /**
   * Сериализует слот один раз и запоминает payload вместе с instances.
   *
   * @param tree Узлы элемента из кэша generator.
   * @param state Состояние instance ForEach.
   * @param trackKey Значение `track` элемента.
   * @returns Конфиги строки для клиента.
   */
  private serializeSlotOnce(
    tree: ComponentTreeNode[],
    state: ForEachInstanceState,
    trackKey: string,
  ) {
    const { result, instances } = runWithCreatedInstanceTracking(() =>
      serializeComponentList(tree),
    );
    state.serializedByKey.set(trackKey, { components: result, instances });
    return result;
  }

  /**
   * Собирает diff списка: полный порядок ключей и конфиги только новых ключей.
   * Индексный контекст обновляется для всех элементов, уже отданные слоты не сериализуются.
   *
   * @param forEachInstance Instance ForEach, для которого строится payload.
   * @returns Payload preload и `ForEachSyncComponentsMessage`.
   */
  private buildSyncPayload(
    forEachInstance: ComponentInstance<this>,
  ): ForEachSyncComponentsPayload {
    const state = this.getInstanceState(forEachInstance);
    const items = getForEachValue(this.config.ref);
    const order = items.map((item) => this.trackKey(item));
    this.lastItemsCheckSum = order.join("|");

    const store: ForEachIndexContext = {};
    for (let index = 0; index < items.length; index++) {
      store[this.itemId(items[index])] = { index: `${index}` };
    }
    this.componentContext.replace(store);
    this.evictRemovedSlots(new Set(order), state);

    const upserts: ForEachSyncComponentsPayload["upserts"] = [];
    for (let index = 0; index < items.length; index++) {
      const trackKey = order[index];
      if (state.serializedByKey.has(trackKey)) {
        continue;
      }
      const itemId = this.itemId(items[index]);
      let tree = state.componentsCache.get(itemId);
      if (!tree) {
        tree = this.generateItemComponents({
          component: this,
          ref: createForEachItemLink(
            this.config.ref,
            this.componentContext.ref(`${itemId}.index`),
          ),
        });
        state.componentsCache.set(itemId, tree);
      }
      upserts.push({
        key: trackKey,
        components: this.serializeSlotOnce(tree, state, trackKey),
      });
    }
    return { order, upserts };
  }

  /**
   * Синхронизирует элементы списка с клиентом для одного instance ForEach.
   *
   * @param forEachInstance Instance ForEach на клиенте.
   */
  private syncForEachInstance(forEachInstance: ComponentInstance<this>) {
    runWithClient(forEachInstance.client!, () => {
      runWithEntryContext(
        forEachInstance.entry,
        forEachInstance.client!,
        () => {
          forEachInstance.client!.outcomingMessage$.next(
            new ForEachSyncComponentsMessage(
              forEachInstance.id,
              this.buildSyncPayload(forEachInstance),
            ),
          );
        },
      );
    });
  }

  /**
   * Отправляет клиенту порядок ключей и конфиги новых элементов (`ForEachSyncComponentsMessage`).
   * Вызывается при onShow и при изменении массива в ref (добавление, удаление, порядок).
   *
   * @param onlyIfChanged Если `true`, sync пропускается, когда не изменился набор `track`-ключей.
   */
  private async syncComponents(onlyIfChanged = true) {
    const value = getForEachValue(this.config.ref);
    const itemsCheckSum = value.map(this.config.track).join("|");
    if (itemsCheckSum === this.lastItemsCheckSum && onlyIfChanged) {
      return;
    }
    if (this.instances.length === 0) {
      return;
    }
    for (const forEachInstance of this.instances) {
      this.syncForEachInstance(forEachInstance);
    }
  }

  /**
   * Создает экземпляр компонента ForEach.
   *
   * @param config Конфигурация инициализации компонента.
   */
  constructor(config: ForEachInitConfig<RefType, ComponentType>) {
    if (typeof config.onShow === "undefined") {
      config.onShow = [];
    }
    if (typeof config.onShow === "function") {
      config.onShow = [config.onShow];
    }
    (config.onShow as (() => void)[]).push(() => {
      void this.syncComponents(this.preload);
      this.instanceCount++;
      if (this.instanceCount === 1) {
        const contextSubscription = new Subscription();
        this.contextSubscription = contextSubscription;
        contextSubscription.add(
          this.config.ref.context
            .watch()
            .pipe(skip(1))
            .subscribe(() => {
              void this.syncComponents(true);
            }),
        );
      }
    });
    if (typeof config.onHide === "undefined") {
      config.onHide = [];
    }
    if (typeof config.onHide === "function") {
      config.onHide = [config.onHide];
    }
    (config.onHide as (() => void)[]).push(() => {
      this.instanceCount--;
      if (this.instanceCount === 0) {
        this.contextSubscription?.unsubscribe();
        this.contextSubscription = undefined;
      }
    });
    super(config);
    this.preload = config.preload ?? false;
    this.componentContext = new ForEachContext(config.ref.context.preload);
    this.destroyInstance$.subscribe((releasedInstance) => {
      this.releaseInstanceState(releasedInstance as ComponentInstance<this>);
    });
    this.stopUsing$.subscribe(() => {
      this.instanceStates.clear();
    });
    // Инициализируем контекст сразу, чтобы при ранней сериализации хранилище уже существовало.
    void this.componentContext.initSync();
  }

  /**
   * Инициализирует свойства компонента.
   *
   * @param initValues Объект конфигурации инициализации.
   * @returns Объект свойств.
   */
  protected initProperties(
    initValues: ForEachInitConfig<RefType, ComponentType>,
  ): PropertiesType {
    const properties = {
      ...super.initProperties(initValues),
      ref: initValues.ref,
      componentContext: this.componentContext,
    } as PropertiesType;
    if (initValues.divider !== undefined) {
      properties.divider = calculateComponents(
        Array.isArray(initValues.divider)
          ? initValues.divider
          : [initValues.divider],
      );
    }
    return properties;
  }

  /**
   * Вызывает `generator` для одного элемента и нормализует результат в массив узлов.
   *
   * @param properties ForEach-экземпляр и ref на элемент списка с индексом.
   * @returns Компоненты одного элемента списка.
   */
  protected generateItemComponents(properties: {
    component: ForEach<RefType, ComponentType>;
    ref: ForEachItemLink<RefType>;
  }): ComponentTreeNode[] {
    const result = this.config.generator(properties);
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Сериализует ForEach; при `preload` включает готовые элементы и divider в properties.
   *
   * @param instance Instance ForEach; если не передан — создаётся новый.
   * @returns Конфиг для клиента.
   */
  serialize(instance?: ComponentInstance<this>): ForEachConfig {
    if (!instance) {
      instance = this.createInstance();
    }
    const result = super.serialize(instance);
    const extra: Partial<
      Pick<ForEachConfig["properties"], "components" | "divider">
    > = {};
    if (this.preload && this.properties.ref.context.inited()) {
      runWithClient(instance.client!, () => {
        runWithEntryContext(instance.entry, instance.client!, () => {
          extra.components = this.buildSyncPayload(instance);
        });
      });
    }
    if (this.properties.divider) {
      extra.divider = serializeComponentList(this.properties.divider);
    }
    if (Object.keys(extra).length > 0) {
      return {
        ...result,
        class: ServerComponentClass.ForEach,
        properties: {
          ...result.properties,
          ...extra,
        } as ForEachConfig["properties"],
      };
    }
    return {
      ...result,
      class: ServerComponentClass.ForEach,
    } as ForEachConfig;
  }
}
