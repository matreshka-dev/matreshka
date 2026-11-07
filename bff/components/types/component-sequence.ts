import { ForEach } from "@matreshka/bff/components/for-each";
import type {
  ComponentTreeNode,
  ContextArrayValueRef,
} from "@matreshka/bff/core";

export type ComponentSequence<
  DataType,
  T extends ComponentTreeNode = ComponentTreeNode,
> = (T | ForEach<ContextArrayValueRef<DataType>, T>)[];
