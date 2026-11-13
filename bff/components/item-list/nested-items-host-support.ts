import { NestedItemsSyncMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/components/nested-items/nested-items-sync-message";
import type { NestedItemBase } from "@matreshka/client-bff-protocol/types/nested-item-base";
import type { ComponentInstance } from "../../core";
import type { ComponentInitConfig } from "../component";
import {
  flattenNestedItems,
  isItemList,
  releaseItemListInstances,
  type SerializedNestedSlotItem,
  type StaticNestedItemCache,
} from "./flatten-nested-items";
import type { ItemList } from "./item-list";
import type { ItemListHost } from "./item-list-host";
import type { NestedItemTreeNode } from "./types";

/** Runtime-состояние slot'а nested-элементов host-кomponenta (map/board). */
export type NestedItemsSlotState<TItem extends NestedItemTreeNode> = {
  /** Имя slot'а на клиенте (`markers`, `items` и т.п.). */
  slot: string;
  /** Исходный гибридный массив: статические элементы и `itemList`. */
  source: (TItem | ItemList<any, TItem>)[];
  /** Все `itemList`, найденные в `source` — для attach и lifecycle. */
  itemLists: ItemList<any, TItem>[];
};

/** Создаёт начальное состояние slot'а из конфига host-кomponenta. */
export function createNestedItemsSlotState<TItem extends NestedItemTreeNode>(
  source: (TItem | ItemList<any, TItem>)[] | undefined,
): NestedItemsSlotState<TItem> {
  const normalizedSource = source ?? [];
  return {
    slot: "",
    source: normalizedSource,
    itemLists: collectItemListsFromSource(normalizedSource),
  };
}

/** Собирает все `itemList` из гибридного массива, сохраняя порядок. */
export function collectItemListsFromSource<TItem extends NestedItemTreeNode>(
  source: (TItem | ItemList<any, TItem>)[] | undefined,
): ItemList<any, TItem>[] {
  const itemLists: ItemList<any, TItem>[] = [];
  for (const entry of source ?? []) {
    if (isItemList(entry)) {
      itemLists.push(entry);
    }
  }
  return itemLists;
}

/** Привязывает `itemList` к host'у и записывает имя slot'а в состояние. */
export function attachItemListsToHost<TItem extends NestedItemTreeNode>(
  host: ItemListHost,
  slot: string,
  state: NestedItemsSlotState<TItem>,
): void {
  state.slot = slot;
  for (const itemList of state.itemLists) {
    itemList.attach(host, slot);
  }
}

/**
 * Подписывает все `itemList` на lifecycle host-кomponenta:
 * `onShow` / `onHide` пробрасываются в `itemList.onHostShow()` / `onHostHide()`.
 */
export function wireNestedItemsHostLifecycle(
  config: ComponentInitConfig<any>,
  itemLists: ItemList<any, any>[],
): void {
  if (typeof config.onShow === "undefined") {
    config.onShow = [];
  }
  if (typeof config.onShow === "function") {
    config.onShow = [config.onShow];
  }
  (config.onShow as (() => void)[]).push(() => {
    for (const itemList of itemLists) {
      itemList.onHostShow();
    }
  });

  if (typeof config.onHide === "undefined") {
    config.onHide = [];
  }
  if (typeof config.onHide === "function") {
    config.onHide = [config.onHide];
  }
  (config.onHide as (() => void)[]).push(() => {
    for (const itemList of itemLists) {
      itemList.onHostHide();
    }
  });
}

/** Кэш слота на одном host-instance: статика сериализуется один раз, sentIds — уже отданные id. */
type SlotInstanceCache = {
  staticById: StaticNestedItemCache;
  sentIds: Set<string>;
};

export type ItemListHostAdapter = ItemListHost & {
  /** Снимает кэш слота вместе с host-instance. */
  releaseHostInstance(instance: ComponentInstance): void;
  /**
   * Flat-массив для первого ответа страницы.
   * Помечает id как уже отданные, чтобы следующий sync не слал их снова.
   */
  serializeSlot(instance: ComponentInstance): NestedItemBase[] | undefined;
};

/**
 * Адаптер `ItemListHost` для map/board: клиенту уходит порядок id
 * и конфиги только тех элементов, которых у instance ещё нет.
 */
export function createItemListHostAdapter<TItem extends NestedItemTreeNode>(
  getInstances: () => readonly ComponentInstance[],
  getSlotState: (slot: string) => NestedItemsSlotState<TItem> | undefined,
  slotName: string,
): ItemListHostAdapter {
  const caches = new Map<ComponentInstance, SlotInstanceCache>();

  const cacheFor = (instance: ComponentInstance): SlotInstanceCache => {
    let cache = caches.get(instance);
    if (!cache) {
      cache = { staticById: new Map(), sentIds: new Set() };
      caches.set(instance, cache);
    }
    return cache;
  };

  const publish = (
    instance: ComponentInstance,
    slot: string,
    flat: NestedItemBase[],
  ) => {
    const cache = cacheFor(instance);
    const order = flat.map((item) => item.id);
    const nextIds = new Set(order);
    for (const id of [...cache.staticById.keys()]) {
      if (nextIds.has(id)) {
        continue;
      }
      const cached = cache.staticById.get(id);
      if (cached) {
        releaseItemListInstances(cached.instances);
      }
      cache.staticById.delete(id);
    }
    const upserts = flat.filter((item) => !cache.sentIds.has(item.id));
    cache.sentIds = nextIds;
    instance.client!.outcomingMessage$.next(
      new NestedItemsSyncMessage(instance.id, { slot, order, upserts }),
    );
  };

  return {
    get hostInstances(): readonly ComponentInstance[] {
      return getInstances();
    },
    syncNestedItems(slot: string, items: NestedItemBase[]): void {
      for (const instance of getInstances().filter((i) => i.client)) {
        publish(instance, slot, items);
      }
    },
    resyncNestedSlot(slot: string): void {
      const state = getSlotState(slot);
      if (!state) {
        return;
      }
      for (const instance of getInstances().filter((i) => i.client)) {
        const cache = cacheFor(instance);
        const flat = flattenNestedItems(
          state.source,
          instance,
          cache.staticById,
        );
        publish(instance, slot, flat);
      }
    },
    releaseHostInstance(instance: ComponentInstance): void {
      const state = getSlotState(slotName);
      for (const itemList of state?.itemLists ?? []) {
        itemList.releaseHostInstance(instance);
      }
      const cache = caches.get(instance);
      if (cache) {
        for (const cached of cache.staticById.values()) {
          releaseItemListInstances(cached.instances);
        }
        caches.delete(instance);
      }
    },
    serializeSlot(instance: ComponentInstance): NestedItemBase[] | undefined {
      const state = getSlotState(slotName);
      const cache = cacheFor(instance);
      const flat = flattenNestedItemsForSerialize(
        state,
        instance,
        cache.staticById,
      );
      if (!flat) {
        return undefined;
      }
      for (const item of flat) {
        cache.sentIds.add(item.id);
      }
      return flat;
    },
  };
}

/**
 * Сериализация slot'а в flat-массив для первого ответа страницы:
 * статика всегда включается, `itemList` — только с `preload: true` и готовыми данными.
 */
export function flattenNestedItemsForSerialize<
  TItem extends NestedItemTreeNode,
>(
  state: NestedItemsSlotState<TItem> | undefined,
  instance: ComponentInstance,
  staticCache?: StaticNestedItemCache,
): SerializedNestedSlotItem<TItem>[] | undefined {
  if (!state || state.source.length === 0) {
    return undefined;
  }
  const filteredSource = state.source.filter((entry) => {
    if (!isItemList(entry)) {
      return true;
    }
    return entry.shouldIncludeInPreloadSerialize();
  });
  if (filteredSource.length === 0) {
    return undefined;
  }
  return flattenNestedItems(filteredSource, instance, staticCache);
}
