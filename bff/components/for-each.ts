import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import type { ForEachSyncComponentsPayload } from "@matreshka/shared/messages/bff-to-client/components/for-each/for-each-sync-components-message";
import { ForEachSyncComponentsMessage } from "@matreshka/shared/messages/bff-to-client/components/for-each/for-each-sync-components-message";
import type { ForEachConfig } from "@matreshka/shared/types/for-each-config";
import { BehaviorSubject, skip, Subscription } from "rxjs";
import { Paths, PathValue } from "ts-essentials";
import { z } from "zod/v4";
import {
  calculateComponents,
  ComponentInstance,
  ComponentTreeNode,
  Context,
  ContextRef,
  ContextRefValue,
  JsonObject,
  runWithClient,
  runWithEntryContext,
  serializeComponentList,
  StandaloneComponent,
} from "../core";
import { serializeForEachSlots } from "../core/utils/serialize-component-tree";
import { runWithCreatedInstanceTracking } from "../core/utils/track-created-instances";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "./component";

type ForEachArrayValue = readonly unknown[] | unknown[];
type ForEachIndexContext = Record<string, { index: `${number}` }>;
type ForEachItemArray<RefType extends ContextRef<any, any>> = Extract<
  ContextRefValue<RefType>,
  ForEachArrayValue
>;

export type CompatibleForEachRef<RefType extends ContextRef<any, any>> = [
  ForEachItemArray<RefType>,
] extends [never]
  ? never
  : RefType;

type ForEachItemData<RefType extends ContextRef<any, any>> =
  ForEachItemArray<RefType>[number];

type ForEachTypedItemRef<
  ContextType extends JsonObject,
  PathType extends string,
  ValueType,
> = Omit<ContextRef<any, any>, "context" | "path" | "ref" | "value"> & {
  readonly context: Context<ContextType>;
  readonly path: PathType;
  readonly __valueType?: ValueType;
  value(): ValueType;
  value(): JsonObject;
  ref<K extends Paths<ValueType>>(
    path: K,
  ): ForEachTypedItemRef<
    ContextType,
    `${PathType}.${K & string}`,
    PathValue<ValueType, K>
  >;
  ref<P2 extends string>(
    path: ContextRef<ContextType, P2>,
  ): ContextRef<ContextType, `${PathType}.${P2}`>;
};

type ForEachItemLink<RefType extends ContextRef<any, any>> =
  RefType extends ContextRef<infer ContextType, infer PathType>
    ? ForEachTypedItemRef<
        ContextType,
        `${PathType}.${number}`,
        ForEachItemData<RefType>
      >
    : never;

/** Кэш generator и instances элементов списка, привязанные к одному instance ForEach. */
type ForEachInstanceState = {
  itemSyncInstances: ComponentInstance[];
  componentsCache: Map<string, ComponentTreeNode | ComponentTreeNode[]>;
};

/** Возвращает массив элементов списка из ref; не-массив даёт пустой массив. */
function getForEachValue<RefType extends ContextRef<any, any>>(
  ref: RefType,
): ForEachItemData<RefType>[] {
  const rawValue = ref.value() as ForEachItemArray<RefType> | undefined;
  return Array.isArray(rawValue)
    ? (rawValue as ForEachItemData<RefType>[])
    : [];
}

/**
 * Связывает ref элемента списка с ref индекса в {@link ForEachContext},
 * чтобы генератор мог читать `ref.value()` и вложенные поля элемента.
 */
function createForEachItemLink<
  ContextType extends JsonObject,
  PathType extends string,
  RefType extends ContextRef<ContextType, PathType> & {
    value(): ForEachArrayValue | undefined;
  },
>(
  ref: RefType,
  indexRef: ContextRef<ForEachIndexContext, `${string}.index`>,
): ForEachItemLink<RefType> {
  return ref.strictRef(indexRef) as ForEachItemLink<RefType>;
}

/**
 * Свойства, передаваемые генератору компонентов в `ForEach`.
 *
 * @property component Компонент `ForEach`, инициирующий генерацию.
 * @property key Ключ контекста, в котором хранятся данные элемента.
 */
export type ForEachGeneratorProperties<
  RefType extends ContextRef<any, any>,
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
  ref: ContextRef<any, any>;
  componentContext: Context<any>;
  components?: (ComponentTreeNode | ComponentTreeNode[])[];
  divider?: ComponentTreeNode[];
} & ComponentProperties;

export const forEach = <
  RefType extends ContextRef<any, any>,
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
  RefType extends ContextRef<any, any>,
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

class ForEachContext<T extends JsonObject> extends Context<T> {
  /**
   * Синхронно поднимает `data$`, чтобы индексы элементов были доступны при preload-сериализации.
   * @returns Тот же экземпляр контекста.
   */
  initSync() {
    // Запрет на повторную инициализацию контекста
    if (this.inited()) return this;
    this.data$ = new BehaviorSubject({} as T);
    this.subscribeToDataChanges();
  }

  /**
   * После in-place обновления карты индексов в `data$` — одна синхронизация с клиентом.
   * @see Context.emitAfterInPlaceMutation
   */
  syncIndexStoreFromMutations() {
    super.emitAfterInPlaceMutation();
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
      schema: z.strictObject({}), // Запрет изменения из внешних источников
    });
  }
}

/**
 * Компонент, отображающий список элементов путём генерации компонентов на основе массива данных.
 */
export class ForEach<
    RefType extends ContextRef<any, any>,
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
  private getInstanceState(
    forEachInstance: ComponentInstance<this>,
  ): ForEachInstanceState {
    let state = this.instanceStates.get(forEachInstance);
    if (!state) {
      state = {
        itemSyncInstances: [],
        componentsCache: new Map(),
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
    this.releaseItemSyncInstances(forEachInstance);
    this.instanceStates.delete(forEachInstance);
  }

  /**
   * Снимает instances дочерних компонентов элементов, созданные при последнем preload/sync
   * для конкретного instance ForEach.
   *
   * @param forEachInstance Instance ForEach, для которого снимаются дочерние instances.
   */
  private releaseItemSyncInstances(forEachInstance: ComponentInstance<this>) {
    const state = this.instanceStates.get(forEachInstance);
    if (!state || state.itemSyncInstances.length === 0) {
      return;
    }
    const byComponent = new Map<Component, ComponentInstance[]>();
    for (const instance of state.itemSyncInstances) {
      const component = instance.component as Component;
      const list = byComponent.get(component) ?? [];
      list.push(instance);
      byComponent.set(component, list);
    }
    for (const [component, instances] of byComponent) {
      component.releaseInstances(instances);
    }
    state.itemSyncInstances = [];
  }

  /**
   * Удаляет из кэша элементы, которых больше нет в данных списка.
   *
   * @param currentItemIds Актуальные ключи элементов после `track`.
   * @param cache Кэш generator для конкретного instance ForEach.
   */
  private evictRemovedItemCaches(
    currentItemIds: Set<string>,
    cache: Map<string, ComponentTreeNode | ComponentTreeNode[]>,
  ) {
    for (const itemId of cache.keys()) {
      if (!currentItemIds.has(itemId)) {
        cache.delete(itemId);
      }
    }
  }

  /**
   * Сериализует слоты элементов списка и запоминает созданные instances для последующего снятия.
   *
   * @param components Слоты по одному на элемент (узел или массив узлов).
   * @param forEachInstance Instance ForEach, в контексте которого выполняется сериализация.
   * @returns Сериализованные конфиги для клиента.
   */
  private serializeItemsWithTracking(
    components: (ComponentTreeNode | ComponentTreeNode[])[],
    forEachInstance: ComponentInstance<this>,
  ) {
    this.releaseItemSyncInstances(forEachInstance);
    const state = this.getInstanceState(forEachInstance);
    const { result, instances } = runWithCreatedInstanceTracking(() =>
      serializeForEachSlots(components),
    );
    state.itemSyncInstances = instances;
    return result;
  }

  /**
   * Строит дерево компонентов по текущему значению ref: обновляет индексы в
   * {@link componentContext}, берёт узлы из кэша instance ForEach или вызывает `generator`.
   *
   * @param forEachInstance Instance ForEach, для которого строится дерево элементов.
   * @returns Слоты элементов в порядке следования в массиве данных.
   */
  private generateComponents(forEachInstance: ComponentInstance<this>) {
    const cache = this.getInstanceState(forEachInstance).componentsCache;
    const value = getForEachValue(this.config.ref);
    const itemsCheckSum = value.map(this.config.track).join("|");
    this.lastItemsCheckSum = itemsCheckSum;
    // Тот же объект, что в BehaviorSubject: мутируем in-place, чтобы strictRef видел
    // индекс через getValue() без next() (иначе срабатывали бы подписчики Context).
    const store = this.componentContext.data$!.getValue();
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    const components = (Array.isArray(value) ? value : []).map(
      (item, index) => {
        const itemId = this.itemId(item);
        store[itemId] = { index: `${index}` };
        if (cache.has(itemId)) {
          return cache.get(itemId)!;
        }
        const result = this.generateItemComponents({
          component: this,
          ref: createForEachItemLink(
            this.config.ref,
            this.componentContext.ref(`${itemId}.index`),
          ),
        });
        cache.set(itemId, result);
        return result;
      },
    );
    this.componentContext.syncIndexStoreFromMutations();
    return components;
  }

  /**
   * Синхронизирует элементы списка с клиентом для одного instance ForEach.
   *
   * @param forEachInstance Instance ForEach на клиенте.
   * @param currentItemIds Актуальные ключи элементов списка.
   */
  private syncForEachInstance(
    forEachInstance: ComponentInstance<this>,
    currentItemIds: Set<string>,
  ) {
    this.evictRemovedItemCaches(
      currentItemIds,
      this.getInstanceState(forEachInstance).componentsCache,
    );
    runWithClient(forEachInstance.client!, () => {
      runWithEntryContext(
        forEachInstance.entry,
        forEachInstance.client!,
        () => {
          const components = this.generateComponents(forEachInstance);
          const serializedComponents = this.serializeItemsWithTracking(
            components,
            forEachInstance,
          );
          forEachInstance.client!.outcomingMessage$.next(
            new ForEachSyncComponentsMessage(
              forEachInstance.id,
              serializedComponents as ForEachSyncComponentsPayload,
            ),
          );
        },
      );
    });
  }

  /**
   * Отправляет клиенту актуальные конфиги элементов (`ForEachSyncComponentsMessage`).
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
    const currentItemIds = new Set(value.map((item) => this.itemId(item)));
    for (const forEachInstance of this.instances) {
      this.syncForEachInstance(forEachInstance, currentItemIds);
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
          this.config.ref.context.init$.subscribe(() => {
            contextSubscription.add(
              this.config.ref.context.data$!.pipe(skip(1)).subscribe(() => {
                void this.syncComponents(true);
              }),
            );
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
    // Инициализируем контекст сразу, чтобы при ранней сериализации data$ уже существовал.
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
          extra.components = this.serializeItemsWithTracking(
            this.generateComponents(instance),
            instance,
          );
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
