import { ForEach } from "@matreshka/bff/components/for-each";
import type { ComponentTreeNode, ContextArrayRef } from "@matreshka/bff/core";

export type ComponentSequence<
  DataType,
  T extends ComponentTreeNode = ComponentTreeNode,
> = (T | ForEach<ContextArrayRef<DataType>, T>)[];
