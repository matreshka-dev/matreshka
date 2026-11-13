import type { ServerComponentConfig } from "@matreshka/client-bff-protocol/types/server-component-config";
import { skip, Subscription } from "rxjs";
import {
  AnySchemaContextRef,
  ComponentInstance,
  ComponentTreeNode,
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

type SerializedItemListItem<ItemType extends NestedItemTreeNode> = Omit<
  ItemType,
  "component"
> & {
  id: string;
  component: ServerComponentConfig;
};

/** Уже отданный клиенту элемент: повторная сериализация создала бы новый instance id. */
type SerializedItemSlot<ItemType extends NestedItemTreeNode> = {
  item: SerializedItemListItem<ItemType>;
  instances: ComponentInstance[];
};

/** Per-instance кэш сгенерированных элементов и уже отданных конфигов. */
type ItemListInstanceState<ItemType extends NestedItemTreeNode> = {
  itemsCache: Map<string, NestedItemTreeNode>;
  serializedById: Map<string, SerializedItemSlot<ItemType>>;
};

/**
 * Динамический сегмент nested-элементов (map markers / board items):
 * читает массив из `Context`, генерирует элементы и синхронизирует host через diff.
 */
export class ItemList<
  RefType extends AnySchemaContextRef,
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
    ItemListInstanceState<ItemType>
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

  /** Сериализованные элементы сегмента для flatten / preload. Уже отданные id не сериализуются. */
  buildItems(instance: ComponentInstance): SerializedItemListItem<ItemType>[] {
    if (!instance.client) {
      return [];
    }
    return runWithClient(instance.client, () =>
      runWithEntryContext(instance.entry, instance.client!, () => {
        const items = this.generateItems(instance);
        // Индексы элементов живут во внутреннем контексте itemList (strictRef).
        // Без authorizeClient клиент не получит его и ref вида
        // `departments.@{…index}.name` резолвится в пустую строку.
        this.indexContext.authorizeClient(instance.client!);
        const state = this.getInstanceState(instance);
        this.evictSerializedItems(
          new Set(items.map((entry) => entry.id)),
          state,
        );
        const result: SerializedItemListItem<ItemType>[] = [];
        for (const { id, item } of items) {
          const cached = state.serializedById.get(id);
          if (cached) {
            result.push(cached.item);
            continue;
          }
          const serialized = this.serializeItemOnce(id, item, state);
          result.push(serialized);
        }
        return result;
      }),
    );
  }

  /** Снимает кэш и instances сегмента, когда host-instance уничтожен. */
  releaseHostInstance(instance: ComponentInstance): void {
    const state = this.instanceStates.get(instance);
    if (!state) {
      return;
    }
    for (const slot of state.serializedById.values()) {
      releaseItemListInstances(slot.instances);
    }
    this.instanceStates.delete(instance);
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
      this.config.ref.context
        .watch()
        .pipe(skip(1))
        .subscribe(() => {
          this.syncToHost(true);
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

  /** Lazy-init per-instance state (кэш строк и уже отданные конфиги). */
  private getInstanceState(
    instance: ComponentInstance,
  ): ItemListInstanceState<ItemType> {
    let state = this.instanceStates.get(instance);
    if (!state) {
      state = {
        itemsCache: new Map(),
        serializedById: new Map(),
      };
      this.instanceStates.set(instance, state);
    }
    return state;
  }

  /** Сериализует элемент один раз и сохраняет instances до ухода ключа из массива. */
  private serializeItemOnce(
    id: string,
    item: ItemType,
    state: ItemListInstanceState<ItemType>,
  ): SerializedItemListItem<ItemType> {
    const { result, instances } = runWithCreatedInstanceTracking(() => ({
      ...item,
      id,
      component: item.component.serialize(),
    }));
    state.serializedById.set(id, { item: result, instances });
    return result;
  }

  /** Снимает instances элементов, которых больше нет в массиве. */
  private evictSerializedItems(
    currentIds: Set<string>,
    state: ItemListInstanceState<ItemType>,
  ): void {
    for (const id of [...state.serializedById.keys()]) {
      if (currentIds.has(id)) {
        continue;
      }
      const slot = state.serializedById.get(id);
      if (slot) {
        releaseItemListInstances(slot.instances);
      }
      state.serializedById.delete(id);
      state.itemsCache.delete("id" + id);
    }
  }

  /** Удаляет из кэша generator строки, которых больше нет в массиве Context. */
  private evictRemovedItemCaches(
    currentItemIds: Set<string>,
    instance: ComponentInstance,
  ): void {
    const cache = this.getInstanceState(instance).itemsCache;
    for (const itemId of [...cache.keys()]) {
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
    this.lastItemsCheckSum = value
      .map((item) => this.config.track(item))
      .join("|");
    const store: Record<string, { index: `${number}` }> = {};
    for (let index = 0; index < value.length; index++) {
      const cacheKey = this.itemCacheKey(value[index]);
      store[cacheKey] = { index: `${index}` };
    }
    this.indexContext.replace(store);

    return value.map((data) => {
      const cacheKey = this.itemCacheKey(data);
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
  }
}

/** Factory для DSL: `itemList({ ref, track, generator, preload? })`. */
export const itemList = <
  RefType extends AnySchemaContextRef,
  ItemType extends NestedItemTreeNode = NestedItemTreeNode,
>(
  config: ItemListInitConfig<RefType, ItemType>,
): ItemList<RefType, ItemType> => new ItemList(config);
