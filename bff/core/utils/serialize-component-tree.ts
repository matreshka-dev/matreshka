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

/** Сериализует overlays для клиента; при отсутствии или пустом массиве — `undefined` (ключ не попадает в JSON). */
export function serializeOverlaysProperty(
  overlays: readonly Overlay[] | undefined,
): SharedOverlay<ServerComponentConfig>[] | undefined {
  if (!overlays?.length) {
    return undefined;
  }
  return serializeOverlays(overlays);
}

export function assignSerializedOverlays(
  out: Record<string, unknown>,
  overlays: readonly Overlay[] | undefined,
): void {
  if (overlays === undefined) {
    return;
  }
  const serialized = serializeOverlaysProperty(overlays);
  if (serialized !== undefined) {
    out.overlays = serialized;
  } else {
    delete out.overlays;
  }
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
