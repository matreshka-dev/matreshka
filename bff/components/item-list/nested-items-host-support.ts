import { NestedItemsSyncMessage } from "@matreshka/shared/messages/bff-to-client/components/nested-items/nested-items-sync-message";
import type { NestedItemBase } from "@matreshka/shared/types/nested-item-base";
import type { ComponentInstance } from "../../core";
import type { ComponentInitConfig } from "../component";
import { flattenNestedItems, isItemList } from "./flatten-nested-items";
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

/**
 * Адаптер `ItemListHost` для map/board: отправляет клиенту
 * `NestedItemsSyncMessage` всем активным instances host-кomponenta.
 */
export function createItemListHostAdapter<TItem extends NestedItemTreeNode>(
  getInstances: () => readonly ComponentInstance[],
  getSlotState: (slot: string) => NestedItemsSlotState<TItem> | undefined,
): ItemListHost {
  return {
    get hostInstances(): readonly ComponentInstance[] {
      return getInstances();
    },
    syncNestedItems(slot: string, items: NestedItemBase[]): void {
      for (const instance of getInstances().filter((i) => i.client)) {
        instance.client!.outcomingMessage$.next(
          new NestedItemsSyncMessage(instance.id, { slot, items }),
        );
      }
    },
    resyncNestedSlot(slot: string): void {
      const state = getSlotState(slot);
      if (!state) {
        return;
      }
      for (const instance of getInstances().filter((i) => i.client)) {
        const flat = flattenNestedItems(state.source, instance);
        instance.client!.outcomingMessage$.next(
          new NestedItemsSyncMessage(instance.id, { slot, items: flat }),
        );
      }
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
): ReturnType<typeof flattenNestedItems<TItem, any>> | undefined {
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
  return flattenNestedItems(filteredSource, instance);
}
