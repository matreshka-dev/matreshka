import type { ServerComponentConfig } from "@matreshka/shared/types/server-component-config";
import { skip, Subscription } from "rxjs";
import {
  ComponentInstance,
  ComponentTreeNode,
  ContextRef,
  runWithClient,
  runWithEntryContext,
} from "../../core";
import { runWithCreatedInstanceTracking } from "../../core/utils/track-created-instances";
import {
  newItemListSegmentId,
  releaseItemListInstances,
} from "./flatten-nested-items";
import type { ItemListHost } from "./item-list-host";
import { ItemListIndexStore } from "./list-from-ref-context";
import {
  createItemListItemLink,
  getItemListValue,
  type ItemListInitConfig,
  type ItemListItemData,
  type NestedItemTreeNode,
} from "./types";

/** Per-instance кэш сгенерированных элементов и временных instances сериализации. */
type ItemListInstanceState = {
  itemSyncInstances: ComponentInstance[];
  itemsCache: Map<string, NestedItemTreeNode>;
};

/**
 * Динамический сегмент nested-элементов (map markers / board items):
 * читает массив из `Context`, генерирует элементы и синхронизирует host через diff.
 */
export class ItemList<
  RefType extends ContextRef<any, any>,
  ItemType extends NestedItemTreeNode = NestedItemTreeNode,
> {
  readonly isItemList = true as const;
  /** Уникальный id сегмента для nested path и release instances. */
  readonly segmentId = newItemListSegmentId();
  readonly preload: boolean;
  private readonly config: ItemListInitConfig<RefType, ItemType>;
  /** Скрытый контекст индексов строк для `ref` внутри generator. */
  private readonly indexContext: ItemListIndexStore;
  private host?: ItemListHost;
  private slot?: string;
  /** Счётчик видимых host-instances (onShow/onHide). */
  private hostShowCount = 0;
  private contextSubscription?: Subscription;
  /** Checksum track-ключей — пропуск лишнего resync. */
  private lastItemsCheckSum = "";
  private readonly instanceStates = new Map<
    ComponentInstance,
    ItemListInstanceState
  >();

  constructor(config: ItemListInitConfig<RefType, ItemType>) {
    this.config = config;
    this.preload = config.preload ?? false;
    this.indexContext = new ItemListIndexStore(config.ref.context.preload);
    void this.indexContext.initSync();
  }

  /** Включать сегмент в preload-serialize страницы. */
  shouldIncludeInPreloadSerialize(): boolean {
    return this.preload && this.config.ref.context.inited();
  }

  /** Привязывает сегмент к host-кomponentu (map/board) и имени slot'а. */
  attach(host: ItemListHost, slot: string): void {
    this.host = host;
    this.slot = slot;
  }

  /** Вызывается host-кomponentом из onShow: подписка на Context и первый sync. */
  onHostShow(): void {
    this.hostShowCount++;
    if (this.hostShowCount === 1) {
      this.subscribeToListRef();
    }
    this.syncToHost(this.preload);
  }

  /** Вызывается host-кomponentом из onHide: отписка, когда host полностью скрыт. */
  onHostHide(): void {
    this.hostShowCount--;
    if (this.hostShowCount <= 0) {
      this.hostShowCount = 0;
      this.contextSubscription?.unsubscribe();
      this.contextSubscription = undefined;
    }
  }

  /** Сериализованные элементы сегмента для flatten / preload. */
  buildItems(instance: ComponentInstance): (Omit<ItemType, "component"> & {
    id: string;
    component: ServerComponentConfig;
  })[] {
    if (!instance.client) {
      return [];
    }
    return runWithClient(instance.client, () =>
      runWithEntryContext(instance.entry, instance.client!, () => {
        this.releaseItemSyncInstances(instance);
        const items = this.generateItems(instance);
        // Индексы элементов живут во внутреннем контексте itemList (strictRef).
        // Без authorizeClient клиент не получит его и ref вида
        // `departments.@{…index}.name` резолвится в пустую строку.
        this.indexContext.authorizeClient(instance.client!);
        const state = this.getInstanceState(instance);
        const { result, instances } = runWithCreatedInstanceTracking(() =>
          items.map(({ id, item }) => ({
            ...item,
            id,
            component: item.component.serialize(),
          })),
        );
        state.itemSyncInstances = instances;
        return result;
      }),
    );
  }

  /**
   * Дерево nested-кomponentов для walk/registration:
   * из кэша активных instances или dry-run generator по текущему массиву.
   */
  getNestedComponents(): ComponentTreeNode[] {
    const components: ComponentTreeNode[] = [];
    for (const state of this.instanceStates.values()) {
      for (const item of state.itemsCache.values()) {
        components.push(item.component);
      }
    }
    if (components.length > 0) {
      return components;
    }
    const value = getItemListValue(this.config.ref);
    for (const data of value) {
      const cacheKey = this.itemCacheKey(data);
      const item = this.config.generator({
        ref: createItemListItemLink(
          this.config.ref,
          this.indexContext.ref(`${cacheKey}.index`),
        ),
        itemList: this,
      });
      components.push(item.component);
    }
    return components;
  }

  /** Подписывается на изменения массива в `Context` после init. */
  private subscribeToListRef(): void {
    if (this.contextSubscription) {
      return;
    }
    const contextSubscription = new Subscription();
    this.contextSubscription = contextSubscription;
    contextSubscription.add(
      this.config.ref.context.init$.subscribe(() => {
        contextSubscription.add(
          this.config.ref.context.data$!.pipe(skip(1)).subscribe(() => {
            this.syncToHost(true);
          }),
        );
      }),
    );
  }

  /**
   * Пересобирает slot на host'е, если изменился состав/порядок (по `track`).
   * `onlyIfChanged: false` — принудительный sync (onShow / preload).
   */
  private syncToHost(onlyIfChanged: boolean): void {
    const value = getItemListValue(this.config.ref);
    const itemsCheckSum = value.map(this.config.track).join("|");
    if (itemsCheckSum === this.lastItemsCheckSum && onlyIfChanged) {
      return;
    }
    this.lastItemsCheckSum = itemsCheckSum;
    const host = this.host;
    const slot = this.slot;
    if (!host || !slot || host.hostInstances.length === 0) {
      return;
    }
    const currentItemIds = new Set(
      value.map((item) => this.itemCacheKey(item)),
    );
    for (const instance of host.hostInstances) {
      this.evictRemovedItemCaches(currentItemIds, instance);
    }
    host.resyncNestedSlot(slot);
  }

  /** Стабильный ключ кэша строки: префикс `id` + результат `track`. */
  private itemCacheKey(item: ItemListItemData<RefType>): string {
    return "id" + this.config.track(item);
  }

  /** Публичный id элемента для клиента (без префикса кэша). */
  private trackId(item: ItemListItemData<RefType>): string {
    return this.config.track(item);
  }

  /** Lazy-init per-instance state (кэш строк и sync instances). */
  private getInstanceState(instance: ComponentInstance): ItemListInstanceState {
    let state = this.instanceStates.get(instance);
    if (!state) {
      state = {
        itemSyncInstances: [],
        itemsCache: new Map(),
      };
      this.instanceStates.set(instance, state);
    }
    return state;
  }

  /** Освобождает временные instances, созданные при прошлой сериализации. */
  private releaseItemSyncInstances(instance: ComponentInstance): void {
    const state = this.instanceStates.get(instance);
    if (!state || state.itemSyncInstances.length === 0) {
      return;
    }
    releaseItemListInstances(state.itemSyncInstances);
    state.itemSyncInstances = [];
  }

  /** Удаляет из кэша строки, которых больше нет в массиве Context. */
  private evictRemovedItemCaches(
    currentItemIds: Set<string>,
    instance: ComponentInstance,
  ): void {
    const cache = this.getInstanceState(instance).itemsCache;
    for (const itemId of cache.keys()) {
      if (!currentItemIds.has(itemId)) {
        cache.delete(itemId);
      }
    }
  }

  /**
   * Строит элементы сегмента для instance:
   * переиспользует кэш по track-ключу, обновляет index store для item ref.
   */
  private generateItems(
    instance: ComponentInstance,
  ): { id: string; item: ItemType }[] {
    const cache = this.getInstanceState(instance).itemsCache;
    const value = getItemListValue(this.config.ref);
    const store = this.indexContext.data$!.getValue();
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    const items = value.map((data, index) => {
      const cacheKey = this.itemCacheKey(data);
      store[cacheKey] = { index: `${index}` };
      let item = cache.get(cacheKey) as ItemType | undefined;
      if (!item) {
        item = this.config.generator({
          ref: createItemListItemLink(
            this.config.ref,
            this.indexContext.ref(`${cacheKey}.index`),
          ),
          itemList: this,
        });
        cache.set(cacheKey, item);
      }
      return { id: this.trackId(data), item };
    });
    this.indexContext.syncIndexStoreFromMutations();
    return items;
  }
}

/** Factory для DSL: `itemList({ ref, track, generator, preload? })`. */
export const itemList = <
  RefType extends ContextRef<any, any>,
  ItemType extends NestedItemTreeNode = NestedItemTreeNode,
>(
  config: ItemListInitConfig<RefType, ItemType>,
): ItemList<RefType, ItemType> => new ItemList(config);
