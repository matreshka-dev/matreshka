import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, ContextRef, StandaloneComponent } from "../../core";
import {
  CompatibleOutputRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  outputValueRefToConfig,
} from "./output-component";

type IconValue = string;

/**
 * Свойства компонента вывода иконки.
 */
export type IconProperties = {
  /**
   * Размер иконки в логических пикселях; на клиенте конвертируется в rem и задаёт ширину/высоту.
   */
  size: number;
} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода иконки.
 */
export type IconInitConfig<
  ComponentType extends Componentable = Icon,
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
  PropertiesType extends IconProperties = IconProperties,
> = {
  /**
   * Размер иконки в логических пикселях; на клиенте конвертируется в rem и задаёт ширину/высоту.
   */
  size: number;
} & OutputInitConfig<IconValue, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends ContextRef<any, any>> =
  IconInitConfig<Icon, RefType>;

type IconValueOrRef<RefType extends ContextRef<any, any>> =
  | IconValue
  | CompatibleOutputRef<IconValue, RefType>;

export function icon<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: IconValueOrRef<RefType>,
): Icon<RefType>;
export function icon<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(config: IconInitConfig<Icon, RefType>): Icon<RefType>;
export function icon<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(
  arg0:
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | IconInitConfig<Icon, RefType>,
  arg1?: IconValueOrRef<RefType>,
): Icon<RefType> {
  if (arg1 !== undefined) {
    return new Icon<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as IconInitConfig<Icon, RefType>,
    );
  }
  return new Icon<RefType>(arg0 as IconInitConfig<Icon, RefType>);
}

/**
 * Компонент для отображения иконки.
 *
 * Наследуется от {@link OutputComponent}.
 */
export class Icon<
    RefType extends ContextRef<any, any> = ContextRef<any, any>,
    PropertiesType extends IconProperties = IconProperties,
  >
  extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Icon;
  }
  /**
   * Инициализирует свойства компонента вывода иконки.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект свойств компонента.
   */
  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      size: initValues.size,
    };
  }
}
