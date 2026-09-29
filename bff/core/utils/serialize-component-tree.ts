import type { Overlay as SharedOverlay } from "@matreshka/shared/types/container-overlay";
import type { ServerComponentConfig } from "@matreshka/shared/types/server-component-config";
import type { Overlay } from "../../components/types/container-overlay";
import { type ComponentTreeNode } from "../types/component-tree-node";

export type SerializedComponentPayload = ServerComponentConfig;

export function serializeComponentList(
  components: readonly ComponentTreeNode[],
): SerializedComponentPayload[] {
  return components.map((c) => c.serialize());
}

export function serializeOverlays(
  overlays: readonly Overlay[],
): SharedOverlay<ServerComponentConfig>[] {
  return overlays.map((o) => ({
    anchors: o.anchors,
    component: o.component.serialize(),
  }));
}

export function serializeForEachSlot(
  slot: ComponentTreeNode | ComponentTreeNode[],
): SerializedComponentPayload | SerializedComponentPayload[] {
  if (Array.isArray(slot)) {
    return serializeComponentList(slot);
  }
  return slot.serialize();
}

export function serializeForEachSlots(
  slots: (ComponentTreeNode | ComponentTreeNode[])[],
): Array<SerializedComponentPayload | SerializedComponentPayload[]> {
  return slots.map((slot) => serializeForEachSlot(slot));
}
