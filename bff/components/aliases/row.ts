import { StackDirection } from "@matreshka/shared/enums/stack-direction";
import { Stack, StackInitConfig } from "../stack";

export type RowInitConfig = Omit<StackInitConfig<Row>, "direction">;

export function row(content: RowInitConfig["content"]): Row;
export function row(
  options: Omit<RowInitConfig, "content">,
  content: RowInitConfig["content"],
): Row;
export function row(config: RowInitConfig): Row;
export function row(
  arg0:
    | RowInitConfig["content"]
    | Omit<RowInitConfig, "content">
    | RowInitConfig,
  arg1?: RowInitConfig["content"],
): Row {
  if (arg1 !== undefined) {
    return new Row({
      ...(arg0 as Omit<RowInitConfig, "content">),
      content: arg1,
    });
  }
  const single = arg0;
  if (
    typeof single === "object" &&
    single !== null &&
    !Array.isArray(single) &&
    "content" in single
  ) {
    return new Row(single as RowInitConfig);
  }
  return new Row({ content: single as RowInitConfig["content"] });
}

/**
 * Горизонтальный Stack: направление всегда {@link StackDirection.Horizontal}.
 */
export class Row extends Stack<StackInitConfig<Row>> {
  constructor(config: RowInitConfig) {
    super({ ...config, direction: StackDirection.Horizontal });
  }
}
