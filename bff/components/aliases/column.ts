import { StackDirection } from "@matreshka/shared/enums/stack-direction";
import { Stack, StackInitConfig } from "../stack";

export type ColumnInitConfig = Omit<StackInitConfig<Column>, "direction">;

export function column(content: ColumnInitConfig["content"]): Column;
export function column(
  options: Omit<ColumnInitConfig, "content">,
  content: ColumnInitConfig["content"],
): Column;
export function column(config: ColumnInitConfig): Column;
export function column(
  arg0:
    | ColumnInitConfig["content"]
    | Omit<ColumnInitConfig, "content">
    | ColumnInitConfig,
  arg1?: ColumnInitConfig["content"],
): Column {
  if (arg1 !== undefined) {
    return new Column({
      ...(arg0 as Omit<ColumnInitConfig, "content">),
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
    return new Column(single as ColumnInitConfig);
  }
  return new Column({ content: single as ColumnInitConfig["content"] });
}

/**
 * Вертикальный Stack: направление всегда {@link StackDirection.Vertical}.
 */
export class Column extends Stack<StackInitConfig<Column>> {
  constructor(config: ColumnInitConfig) {
    super({ ...config, direction: StackDirection.Vertical });
  }
}
