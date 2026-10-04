import { RatioMode } from "@matreshka/shared/enums/ratio-mode";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import {
  normalizeFlexItem,
  type FlexItemSpec,
} from "@matreshka/shared/types/flex-item";
import type { RadiusPx } from "@matreshka/shared/types/radius-px";
import { Componentable, ContextRef, StandaloneComponent } from "../../core";
import { ServerComponentAction } from "../component";
import {
  CompatibleOutputRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  StringOutputContextRef,
  outputValueRefToConfig,
} from "./output-component";
export { RatioMode } from "@matreshka/shared/enums/ratio-mode";
/** @deprecated Use RatioMode instead */
export { RatioMode as ImageMode } from "@matreshka/shared/enums/ratio-mode";

/**
 * Свойства компонента вывода изображения.
 * @property ratio Соотношение сторон и режим вписывания (`object-fit` / аналог).
 */
export type ImageProperties = {
  ratio?: {
    value: number;
    mode: RatioMode;
  };
  /**
   * Скругление углов в логических пикселях; на клиенте — в rem.
   */
  radius?: RadiusPx;
  /**
   * Поведение flex-item внутри родительского stack: `{ grow }`, `{ basis }` или явные поля.
   */
  flexItem?: FlexItemSpec;
} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода изображения.
 * @property ratio Соотношение сторон и режим вписывания.
 * @property radius Скругление (логические px).
 * @property onClick Обработчики нажатия на изображение.
 */
export type ImageInitConfig<
  ComponentType extends Componentable = Image,
  RefType extends StringOutputContextRef = StringOutputContextRef,
  PropertiesType extends ImageProperties = ImageProperties,
> = {
  ratio?: {
    value: number;
    mode: RatioMode;
  };
  /**
   * Скругление углов в логических пикселях; на клиенте — в rem.
   */
  radius?: RadiusPx;
  /**
   * Поведение flex-item внутри родительского stack: `{ grow }`, `{ basis }` или явные поля.
   */
  flexItem?: FlexItemSpec;
  onClick?:
    | ServerComponentAction<ComponentType>
    | ServerComponentAction<ComponentType>[];
} & OutputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends StringOutputContextRef> =
  ImageInitConfig<any, RefType>;

type ImageValueOrRef<RefType extends StringOutputContextRef> =
  | string
  | CompatibleOutputRef<string, RefType>;

export function image<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: ImageValueOrRef<RefType>,
): Image<RefType>;
export function image<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(valueOrRef: ImageValueOrRef<RefType>): Image<RefType>;
export function image<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(config: ImageInitConfig<any, RefType>): Image<RefType>;
export function image<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  arg0:
    | ImageValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | ImageInitConfig<any, RefType>,
  arg1?: ImageValueOrRef<RefType>,
): Image<RefType> {
  if (arg1 !== undefined) {
    return new Image<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as ImageInitConfig<any, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "string" || single instanceof ContextRef) {
    return new Image<RefType>(
      outputValueRefToConfig(single, {}) as ImageInitConfig<any, RefType>,
    );
  }
  return new Image<RefType>(single as ImageInitConfig<any, RefType>);
}

/**
 * Компонент для вывода изображения.
 */
export class Image<
    RefType extends StringOutputContextRef = StringOutputContextRef,
    PropertiesType extends ImageProperties = ImageProperties,
  >
  extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType>
  implements StandaloneComponent
{
  /**
   * Создает экземпляр изображения.
   * @param config Конфигурация инициализации изображения.
   */
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
    if (config.onClick) {
      this.bindActions("click", config.onClick);
    }
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Image;
  }

  /**
   * Инициализирует свойства компонента вывода изображения.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект свойств компонента.
   */
  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      ratio: initValues.ratio,
      radius: initValues.radius,
      flexItem: normalizeFlexItem(initValues.flexItem),
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = { ...overrides };
    if (overrides.flexItem !== undefined) {
      out.flexItem = normalizeFlexItem(overrides.flexItem);
    }
    return out;
  }
}
