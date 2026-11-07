import type { Paths, PathValue } from "ts-essentials";
import type {
  AnySchemaContextRef,
  ComponentTreeNode,
  ContextRef,
  JsonObject,
} from "../../core";

export type ListArrayValue = readonly unknown[] | unknown[];

type ItemArray<RefType extends AnySchemaContextRef> = Extract<
  ReturnType<RefType["get"]>,
  ListArrayValue
>;

export type CompatibleItemListRef<RefType extends AnySchemaContextRef> = [
  ItemArray<RefType>,
] extends [never]
  ? never
  : RefType;

export type ItemListItemData<RefType extends AnySchemaContextRef> =
  ItemArray<RefType>[number];

export type ItemListTypedItemRef<
  ContextType extends JsonObject,
  PathType extends string,
  ValueType,
> = Omit<AnySchemaContextRef, "path" | "ref" | "get"> & {
  readonly path: PathType;
  readonly __valueType?: ValueType;
  get(): ValueType;
  get(): JsonObject;
  ref<K extends Paths<ValueType>>(
    path: K,
  ): ItemListTypedItemRef<
    ContextType,
    `${PathType}.${K & string}`,
    PathValue<ValueType, K>
  >;
  ref<P2 extends string>(
    path: ContextRef<ContextType, P2, any>,
  ): ContextRef<ContextType, `${PathType}.${P2}`, any>;
};

export type ItemListItemLink<RefType extends AnySchemaContextRef> =
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
  RefType extends AnySchemaContextRef,
  ItemType extends NestedItemTreeNode = NestedItemTreeNode,
> = {
  ref: ItemListItemLink<RefType>;
  itemList: { readonly segmentId: string };
};

export type ItemListInitConfig<
  RefType extends AnySchemaContextRef,
  ItemType extends NestedItemTreeNode = NestedItemTreeNode,
> = {
  ref: CompatibleItemListRef<RefType>;
  track: (data: ItemListItemData<RefType>) => string;
  preload?: boolean;
  generator: (
    properties: ItemListGeneratorProperties<RefType, ItemType>,
  ) => ItemType;
};

export function getItemListValue<RefType extends AnySchemaContextRef>(
  ref: RefType,
): ItemListItemData<RefType>[] {
  const rawValue = ref.get() as ItemArray<RefType> | undefined;
  return Array.isArray(rawValue)
    ? (rawValue as ItemListItemData<RefType>[])
    : [];
}

type ItemListIndexContextRecord = Record<string, { index: `${number}` }>;

export function createItemListItemLink<
  ContextType extends JsonObject,
  PathType extends string,
  RefType extends ContextRef<ContextType, PathType, any> & {
    get(): ListArrayValue | undefined;
  },
>(
  ref: RefType,
  indexRef: ContextRef<ItemListIndexContextRecord, `${string}.index`, any>,
): ItemListItemLink<RefType> {
  return ref.strictRef(indexRef) as unknown as ItemListItemLink<RefType>;
}
