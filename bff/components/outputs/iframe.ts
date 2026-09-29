import { IframeAllow } from "@matreshka/shared/enums/iframe-allow";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, ContextRef } from "../../core";
import {
  CompatibleOutputRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  outputValueRefToConfig,
} from "./output-component";

export { IframeAllow } from "@matreshka/shared/enums/iframe-allow";

/**
 * Свойства компонента вывода iframe.
 *
 * @property allow Список разрешённых возможностей для атрибута `allow` iframe.
 * @property ratio Соотношение сторон iframe через CSS `aspect-ratio`.
 */
export type IframeProperties = {
  allow?: IframeAllow[];
  ratio?: {
    value: number;
  };
} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода iframe.
 *
 * @property allow Список разрешённых возможностей для атрибута `allow` iframe.
 * @property ratio Соотношение сторон iframe через CSS `aspect-ratio`.
 */
export type IframeInitConfig<
  ComponentType extends Componentable = Iframe,
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
  PropertiesType extends IframeProperties = IframeProperties,
> = {
  allow?: IframeAllow[];
  ratio?: {
    value: number;
  };
} & OutputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends ContextRef<any, any>> =
  IframeInitConfig<Iframe, RefType>;

type IframeValueOrRef<RefType extends ContextRef<any, any>> =
  | string
  | CompatibleOutputRef<string, RefType>;

export function iframe<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: IframeValueOrRef<RefType>,
): Iframe<RefType>;
export function iframe<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(valueOrRef: IframeValueOrRef<RefType>): Iframe<RefType>;
export function iframe<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(config: IframeInitConfig<Iframe, RefType>): Iframe<RefType>;
export function iframe<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(
  arg0:
    | IframeValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | IframeInitConfig<Iframe, RefType>,
  arg1?: IframeValueOrRef<RefType>,
): Iframe<RefType> {
  if (arg1 !== undefined) {
    return new Iframe<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as IframeInitConfig<Iframe, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "string" || single instanceof ContextRef) {
    return new Iframe<RefType>(
      outputValueRefToConfig(single, {}) as IframeInitConfig<Iframe, RefType>,
    );
  }
  return new Iframe<RefType>(single as IframeInitConfig<Iframe, RefType>);
}

/**
 * Компонент вывода iframe.
 */
export class Iframe<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
  PropertiesType extends IframeProperties = IframeProperties,
> extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType> {
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Iframe;
  }

  /**
   * Инициализирует свойства компонента на основе конфигурации.
   *
   * @param initValues Объект конфигурации инициализации.
   * @returns Объект свойств компонента.
   */
  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      allow: initValues.allow,
      ratio: initValues.ratio,
    };
  }
}
