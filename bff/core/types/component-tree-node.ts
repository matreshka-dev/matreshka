import { ComponentInstance } from "./component-instance";
import type { Componentable } from "./componentable";
import type { StandaloneComponent } from "./standalone-component";

/**
 * Узел дерева UI: самостоятельный компонент или заранее созданное {@link ComponentInstance}.
 * В отличие от {@link Componentable}, сюда нельзя положить entry (страницу, dialog, popover).
 */
export type ComponentTreeNode =
  | StandaloneComponent
  | ComponentInstance<StandaloneComponent>;

export function isComponentInstance(
  node: ComponentTreeNode | Componentable,
): node is ComponentInstance<StandaloneComponent> {
  return node instanceof ComponentInstance;
}

/** Эвристика для фабрик: standalone-компонент или {@link ComponentInstance}. */
export function isComponentTreeNodeLike(x: unknown): x is ComponentTreeNode {
  if (x instanceof ComponentInstance) {
    return true;
  }
  return (
    typeof x === "object" &&
    x !== null &&
    "standalone" in x &&
    typeof (x as { standalone?: unknown }).standalone === "function"
  );
}
