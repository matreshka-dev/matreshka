import * as crypto from "node:crypto";
import type { ComponentInstance, ComponentTreeNode } from "../../core";
import { runWithClient, runWithEntryContext } from "../../core";
import { runWithCreatedInstanceTracking } from "../../core/utils/track-created-instances";
import { Component } from "../component";
import type { ItemList } from "./item-list";
import type { NestedItemTreeNode } from "./types";

export function isItemList(value: unknown): value is ItemList<any, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ItemList<any, any>).isItemList === true
  );
}

export function flattenNestedItems<
  TItem extends NestedItemTreeNode,
  TSerialized extends TItem & {
    id: string;
    component: import("@matreshka/shared/types/server-component-config").ServerComponentConfig;
  },
>(
  source: (TItem | ItemList<any, TItem>)[] | undefined,
  instance: ComponentInstance,
): TSerialized[] {
  const result: TSerialized[] = [];
  for (const entry of source ?? []) {
    if (isItemList(entry)) {
      result.push(...(entry.buildItems(instance) as TSerialized[]));
    } else {
      result.push(serializeStaticNestedItem(entry, instance) as TSerialized);
    }
  }
  return result;
}

function serializeStaticNestedItem<TItem extends NestedItemTreeNode>(
  entry: TItem,
  instance: ComponentInstance,
): TItem & {
  id: string;
  component: ReturnType<ComponentTreeNode["serialize"]>;
} {
  return runWithClient(instance.client!, () =>
    runWithEntryContext(instance.entry, instance.client!, () => {
      const { result } = runWithCreatedInstanceTracking(() => ({
        ...entry,
        id: entry.component.id,
        component: entry.component.serialize(),
      }));
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
