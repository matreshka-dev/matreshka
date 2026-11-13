import type { NestedItemBase } from "@matreshka/client-bff-protocol/types/nested-item-base";
import type { ServerComponentConfig } from "@matreshka/client-bff-protocol/types/server-component-config";
import * as crypto from "node:crypto";
import type { ComponentInstance, ComponentTreeNode } from "../../core";
import { runWithClient, runWithEntryContext } from "../../core";
import { runWithCreatedInstanceTracking } from "../../core/utils/track-created-instances";
import { Component } from "../component";
import type { ItemList } from "./item-list";
import type { NestedItemTreeNode } from "./types";

/** Статический элемент слота, сериализованный один раз на host-instance. */
export type CachedStaticNestedItem = {
  item: NestedItemBase;
  instances: ComponentInstance[];
};

export type StaticNestedItemCache = Map<string, CachedStaticNestedItem>;

export type SerializedNestedSlotItem<TItem extends NestedItemTreeNode> = Omit<
  TItem,
  "component"
> & {
  id: string;
  component: ServerComponentConfig;
};

export function isItemList(value: unknown): value is ItemList<any, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ItemList<any, any>).isItemList === true
  );
}

export function flattenNestedItems<TItem extends NestedItemTreeNode>(
  source: (TItem | ItemList<any, TItem>)[] | undefined,
  instance: ComponentInstance,
  staticCache?: StaticNestedItemCache,
): SerializedNestedSlotItem<TItem>[] {
  const result: SerializedNestedSlotItem<TItem>[] = [];
  for (const entry of source ?? []) {
    if (isItemList(entry)) {
      result.push(...entry.buildItems(instance));
    } else {
      result.push(serializeStaticNestedItem(entry, instance, staticCache));
    }
  }
  return result;
}

function serializeStaticNestedItem<TItem extends NestedItemTreeNode>(
  entry: TItem,
  instance: ComponentInstance,
  staticCache?: StaticNestedItemCache,
): TItem & {
  id: string;
  component: ReturnType<ComponentTreeNode["serialize"]>;
} {
  const id = entry.component.id;
  const cached = staticCache?.get(id);
  if (cached) {
    return cached.item as TItem & {
      id: string;
      component: ReturnType<ComponentTreeNode["serialize"]>;
    };
  }
  return runWithClient(instance.client!, () =>
    runWithEntryContext(instance.entry, instance.client!, () => {
      const { result, instances } = runWithCreatedInstanceTracking(() => ({
        ...entry,
        id,
        component: entry.component.serialize(),
      }));
      staticCache?.set(id, { item: result, instances });
      return result;
    }),
  );
}

export function collectNestedComponentsFromSource<
  TItem extends NestedItemTreeNode,
>(source: (TItem | ItemList<any, TItem>)[] | undefined): ComponentTreeNode[] {
  const result: ComponentTreeNode[] = [];
  for (const entry of source ?? []) {
    if (isItemList(entry)) {
      result.push(...entry.getNestedComponents());
    } else {
      result.push(entry.component);
    }
  }
  return result;
}

export function releaseItemListInstances(instances: ComponentInstance[]): void {
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

export function newItemListSegmentId(): string {
  return crypto.randomUUID();
}
