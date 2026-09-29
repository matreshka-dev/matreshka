import type { Paths, PathValue } from "ts-essentials";
import type { ComponentTreeNode, ContextRef, JsonObject } from "../../core";

export type ListArrayValue = readonly unknown[] | unknown[];

type ItemArray<RefType extends ContextRef<any, any>> = Extract<
  ReturnType<RefType["value"]>,
  ListArrayValue
>;

export type CompatibleItemListRef<RefType extends ContextRef<any, any>> = [
  ItemArray<RefType>,
] extends [never]
  ? never
  : RefType;

export type ItemListItemData<RefType extends ContextRef<any, any>> =
  ItemArray<RefType>[number];

export type ItemListTypedItemRef<
  ContextType extends JsonObject,
  PathType extends string,
  ValueType,
> = Omit<ContextRef<any, any>, "path" | "ref" | "value"> & {
  readonly path: PathType;
  readonly __valueType?: ValueType;
  value(): ValueType;
  value(): JsonObject;
  ref<K extends Paths<ValueType>>(
    path: K,
  ): ItemListTypedItemRef<
    ContextType,
    `${PathType}.${K & string}`,
    PathValue<ValueType, K>
  >;
  ref<P2 extends string>(
    path: ContextRef<ContextType, P2>,
  ): ContextRef<ContextType, `${PathType}.${P2}`>;
};

export type ItemListItemLink<RefType extends ContextRef<any, any>> =
  RefType extends ContextRef<infer ContextType, infer PathType>
    ? ItemListTypedItemRef<
        ContextType,
        `${PathType}.${number}`,
        ItemListItemData<RefType>
      >
    : never;

export type NestedItemTreeNode = {
  component: ComponentTreeNode;
};

export type ItemListGeneratorProperties<
  RefType extends ContextRef<any, any>,
  ItemType extends NestedItemTreeNode = NestedItemTreeNode,
> = {
  ref: ItemListItemLink<RefType>;
  itemList: { readonly segmentId: string };
};

export type ItemListInitConfig<
  RefType extends ContextRef<any, any>,
  ItemType extends NestedItemTreeNode = NestedItemTreeNode,
> = {
  ref: CompatibleItemListRef<RefType>;
  track: (data: ItemListItemData<RefType>) => string;
  preload?: boolean;
  generator: (
    properties: ItemListGeneratorProperties<RefType, ItemType>,
  ) => ItemType;
};

export function getItemListValue<RefType extends ContextRef<any, any>>(
  ref: RefType,
): ItemListItemData<RefType>[] {
  const rawValue = ref.value() as ItemArray<RefType> | undefined;
  return Array.isArray(rawValue)
    ? (rawValue as ItemListItemData<RefType>[])
    : [];
}

type ItemListIndexContextRecord = Record<string, { index: `${number}` }>;

export function createItemListItemLink<
  ContextType extends JsonObject,
  PathType extends string,
  RefType extends ContextRef<ContextType, PathType> & {
    value(): ListArrayValue | undefined;
  },
>(
  ref: RefType,
  indexRef: ContextRef<ItemListIndexContextRecord, `${string}.index`>,
): ItemListItemLink<RefType> {
  return ref.strictRef(indexRef) as unknown as ItemListItemLink<RefType>;
}
