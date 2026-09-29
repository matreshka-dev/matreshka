import { StackDirection } from "@matreshka/shared/enums/stack-direction";
import type { ComponentTreeNode } from "../../core/types/component-tree-node";
import { isComponentTreeNodeLike } from "../../core/types/component-tree-node";
import type { MixedWithCallbacksArray } from "../../core/types/mixed-with-callbacks-array";
import {
  Overflow,
  Stack,
  StackCrossAxisAlign,
  StackInitConfig,
  StackMainAxisAlign,
} from "../stack";

const defaultButtonAlign = {
  main: StackMainAxisAlign.Center,
  cross: StackCrossAxisAlign.Center,
};

/** Один элемент или массив — как раньше у поля `label` у кнопки. */
export type ButtonContentInput =
  | ComponentTreeNode
  | MixedWithCallbacksArray<ComponentTreeNode>;

export type ButtonInitConfig = Omit<
  StackInitConfig<Button>,
  "surface" | "direction" | "content"
> & {
  content: ButtonContentInput;
};

export function button(content: ButtonInitConfig["content"]): Button;
export function button(
  options: Omit<ButtonInitConfig, "content">,
  content: ButtonInitConfig["content"],
): Button;
export function button(config: ButtonInitConfig): Button;
export function button(
  arg0:
    | ButtonInitConfig["content"]
    | Omit<ButtonInitConfig, "content">
    | ButtonInitConfig,
  arg1?: ButtonInitConfig["content"],
): Button {
  if (arg1 !== undefined) {
    return new Button({
      ...(arg0 as Omit<ButtonInitConfig, "content">),
      content: normalizeButtonContent(arg1),
    });
  }
  const single = arg0;
  if (Array.isArray(single)) {
    return new Button({ content: normalizeButtonContent(single) });
  }
  if (isComponentTreeNodeLike(single)) {
    return new Button({
      content: normalizeButtonContent(single as ButtonInitConfig["content"]),
    });
  }
  return new Button(single as ButtonInitConfig);
}

function normalizeButtonContent(
  content: ButtonContentInput,
): MixedWithCallbacksArray<ComponentTreeNode> {
  return Array.isArray(content)
    ? content
    : ([content] as MixedWithCallbacksArray<ComponentTreeNode>);
}

/**
 * Stack-кнопка: горизонтальный ряд, `surface`, выравнивание по умолчанию по центру по обеим осям (можно переопределить через `align`).
 */
export class Button extends Stack<StackInitConfig<Button>> {
  constructor(config: ButtonInitConfig) {
    super({
      ...config,
      surface: true,
      direction: StackDirection.Horizontal,
      overflow: config.overflow ?? Overflow.Hidden,
      // flexItem: { grow: 1 },
      align: {
        main: config.align?.main ?? defaultButtonAlign.main,
        cross: config.align?.cross ?? defaultButtonAlign.cross,
      },
      content: normalizeButtonContent(config.content),
    });
  }
}
