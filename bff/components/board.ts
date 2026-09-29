import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { BoardSetCenterMessage } from "@matreshka/shared/messages/bff-to-client/components/board/board-set-center-message";
import { BoardSetZoomMessage } from "@matreshka/shared/messages/bff-to-client/components/board/board-set-zoom-message";
import { BoardZoomInMessage } from "@matreshka/shared/messages/bff-to-client/components/board/board-zoom-in-message";
import { BoardZoomOutMessage } from "@matreshka/shared/messages/bff-to-client/components/board/board-zoom-out-message";
import type {
  BoardConfig,
  BoardPoint,
} from "@matreshka/shared/types/board-config";
import {
  normalizeFlexItem,
  type FlexItemSpec,
} from "@matreshka/shared/types/flex-item";
import type { NestedItemBase } from "@matreshka/shared/types/nested-item-base";
import {
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  serializeOverlays,
  StandaloneComponent,
} from "../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
  ServerComponentAction,
} from "./component";
import {
  attachItemListsToHost,
  createItemListHostAdapter,
  createNestedItemsSlotState,
  flattenNestedItemsForSerialize,
  wireNestedItemsHostLifecycle,
} from "./item-list";
import { flattenNestedItems } from "./item-list/flatten-nested-items";
import type { ItemList } from "./item-list/item-list";
import type { ItemListHost } from "./item-list/item-list-host";
import { Overlay } from "./types/container-overlay";

const DEFAULT_ZOOM = 1;
const DEFAULT_MIN_ZOOM = 0.25;
const DEFAULT_MAX_ZOOM = 4;
const DEFAULT_ZOOM_STEP = 0.3;

export const board = (config: BoardInitConfig<Board>): Board =>
  new Board(config);

export type BoardItem = {
  position: BoardPoint;
  component: ComponentTreeNode;
};

export type BoardItemEntry = BoardItem | ItemList<any, BoardItem>;

export type BoardProperties = {
  center: BoardPoint;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  overlays?: Overlay[];
  flexItem?: FlexItemSpec;
} & ComponentProperties;

export type BoardInitConfig<
  ComponentType extends Componentable = Board,
  PropertiesType extends BoardProperties = BoardProperties,
> = {
  center?: BoardPoint;
  overlays?: Overlay[];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  /** Шаг зума для колёсика, pinch и zoomIn/zoomOut (@panzoom/panzoom `step`). */
  zoomStep?: number;
  flexItem?: FlexItemSpec;
  items?: BoardItemEntry[];
  onCenterChange?:
    | ServerComponentAction<ComponentType, BoardPoint>
    | ServerComponentAction<ComponentType, BoardPoint>[];
  onZoomChange?:
    | ServerComponentAction<ComponentType, number>
    | ServerComponentAction<ComponentType, number>[];
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = BoardInitConfig<Board>;

export class Board<
    InitConfigType extends BoardInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends BoardProperties = BoardProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent, ItemListHost
{
  private readonly itemsSlot = {
    slot: "",
    source: [] as BoardItemEntry[],
    itemLists: [] as ItemList<any, BoardItem>[],
  };
  private readonly itemListHostAdapter!: ItemListHost;

  setCenter(center: BoardPoint, instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new BoardSetCenterMessage(instance.id, center),
          );
        });
    } else {
      this.broadcast(new BoardSetCenterMessage(this.id, center));
    }
  }

  setZoom(zoom: number, instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new BoardSetZoomMessage(instance.id, zoom),
          );
        });
    } else {
      this.broadcast(new BoardSetZoomMessage(this.id, zoom));
    }
  }

  zoomIn(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new BoardZoomInMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new BoardZoomInMessage(this.id));
    }
  }

  zoomOut(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new BoardZoomOutMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new BoardZoomOutMessage(this.id));
    }
  }

  constructor(config: InitConfigType) {
    const itemsSlot = createNestedItemsSlotState<BoardItem>(config.items);
    wireNestedItemsHostLifecycle(config, itemsSlot.itemLists);
    super(config);
    this.itemsSlot.source = itemsSlot.source;
    this.itemsSlot.itemLists = itemsSlot.itemLists;
    attachItemListsToHost(this, "items", this.itemsSlot);
    this.itemListHostAdapter = createItemListHostAdapter(
      () => this.instances,
      (slot) => (slot === "items" ? this.itemsSlot : undefined),
    );
    if (config.onCenterChange) {
      const actions = config.onCenterChange as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("center-change", actions);
    }
    if (config.onZoomChange) {
      const actions = config.onZoomChange as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("zoom-change", actions);
    }
  }

  get hostInstances(): readonly ComponentInstance[] {
    return this.instances;
  }

  syncNestedItems(slot: string, items: NestedItemBase[]): void {
    this.itemListHostAdapter.syncNestedItems(slot, items);
  }

  resyncNestedSlot(slot: string): void {
    this.itemListHostAdapter.resyncNestedSlot(slot);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Board;
  }

  standalone(): true {
    return true;
  }

  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      center: initValues.center ?? { x: 0, y: 0 },
      zoom: initValues.zoom ?? DEFAULT_ZOOM,
      minZoom: initValues.minZoom ?? DEFAULT_MIN_ZOOM,
      maxZoom: initValues.maxZoom ?? DEFAULT_MAX_ZOOM,
      zoomStep: initValues.zoomStep ?? DEFAULT_ZOOM_STEP,
      overlays: initValues.overlays,
      flexItem: normalizeFlexItem(initValues.flexItem),
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType & { items?: BoardItemEntry[] }>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = { ...overrides };
    if (overrides.overlays !== undefined) {
      out.overlays = serializeOverlays(overrides.overlays);
    }
    if (overrides.items !== undefined) {
      const instance = this.createInstance();
      out.items = flattenNestedItems(overrides.items, instance);
    }
    if (overrides.flexItem !== undefined) {
      out.flexItem = normalizeFlexItem(overrides.flexItem);
    }
    return out;
  }

  serialize(instance?: ComponentInstance<this>): BoardConfig {
    if (!instance) {
      instance = this.createInstance();
    }
    const result = super.serialize(instance);
    const p = this.properties;
    const items = flattenNestedItemsForSerialize(this.itemsSlot, instance);
    return {
      ...result,
      class: ServerComponentClass.Board,
      properties: {
        ...p,
        overlays: p.overlays ? serializeOverlays(p.overlays) : [],
        items: items ?? [],
      },
    };
  }
}

export { itemList } from "./item-list";
