import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import type { ContainerConfig } from "@matreshka/shared/types/container-config";
import {
  calculateComponents,
  Componentable,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  StandaloneComponent,
} from "../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "./component";

export type ContainerProperties = {
  content: ComponentTreeNode[];
} & ComponentProperties;

/**
 * Конфигурация инициализации для компонента Container.
 *
 * @template T Тип вложенных компонентов.
 * @property content Массив вложенных компонентов.
 */
export type ContainerInitConfig<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
  ComponentType extends Componentable = Container,
  PropertiesType extends ContainerProperties = ContainerProperties,
> = {
  content: MixedWithCallbacksArray<ContentType>;
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
> = ContainerInitConfig<ContentType, Container>;

export function container<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(
  content: DefaultInitConfigType<ContentType>["content"],
): Container<ContentType>;
export function container<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(
  options: Omit<DefaultInitConfigType<ContentType>, "content">,
  content: DefaultInitConfigType<ContentType>["content"],
): Container<ContentType>;
export function container<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(config: DefaultInitConfigType<ContentType>): Container<ContentType>;
export function container<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(
  arg0:
    | DefaultInitConfigType<ContentType>["content"]
    | Omit<DefaultInitConfigType<ContentType>, "content">
    | DefaultInitConfigType<ContentType>,
  arg1?: DefaultInitConfigType<ContentType>["content"],
): Container<ContentType> {
  if (arg1 !== undefined) {
    return new Container<ContentType>({
      ...(arg0 as Omit<DefaultInitConfigType<ContentType>, "content">),
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
    return new Container<ContentType>(single);
  }
  return new Container<ContentType>({
    content: single as DefaultInitConfigType<ContentType>["content"],
  });
}

/**
 * Компонент-контейнер, содержащий массив вложенных компонентов.
 * Используется для обобщения логики отображения компонент (условий, палитры), чтобы не писать одинаковый код для каждого компонента.
 *
 * @template T Тип вложенных узлов дерева ({@link ComponentTreeNode}).
 */
export class Container<
    ContentType extends ComponentTreeNode = ComponentTreeNode,
    InitConfigType extends ContainerInitConfig<
      ContentType,
      any
    > = DefaultInitConfigType<ContentType>,
    PropertiesType extends ContainerProperties = ContainerProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  /**
   * Возвращает уникальный идентификатор класса компонента.
   * @returns Строка `"container"`.
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Container;
  }

  /**
   * Возвращает флаг, указывающий, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Инициализирует свойства компонента на основе переданных значений.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект с инициализированными свойствами.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(initValues.content),
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    return {
      ...overrides,
      content: overrides.content
        ? serializeComponentList(overrides.content)
        : undefined,
    };
  }

  serialize(): ContainerConfig {
    const result = super.serialize();
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.Container,
      properties: {
        ...p,
        content: serializeComponentList(p.content),
      },
    };
  }
}
