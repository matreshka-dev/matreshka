import type { ComponentTreeNode } from "@matreshka/bff/core";
import type { Overlay as OverlayShape } from "@matreshka/client-bff-protocol/types/container-overlay";

export type Overlay = OverlayShape<ComponentTreeNode>;
