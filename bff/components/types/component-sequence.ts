import { ForEach, ForEachDataRef } from "@matreshka/bff/components/for-each";
import type { ComponentTreeNode } from "@matreshka/bff/core";

export type ComponentSequence<
  DataType,
  T extends ComponentTreeNode = ComponentTreeNode,
> = (T | ForEach<ForEachDataRef<DataType>, T>)[];
