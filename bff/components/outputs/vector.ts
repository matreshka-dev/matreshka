import { RatioMode } from "@matreshka/shared/enums/ratio-mode";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { VectorMode } from "@matreshka/shared/enums/vector-mode";
import {
  normalizeFlexItem,
  type FlexItemSpec,
} from "@matreshka/shared/types/flex-item";
import { Componentable, ContextRef, StandaloneComponent } from "../../core";
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
export { VectorMode } from "@matreshka/shared/enums/vector-mode";

type VectorValue = string;

/**
 * Свойства компонента вывода векторной графики.
 */
export type VectorProperties = {
  mode: VectorMode;
  flexItem?: FlexItemSpec;
  ratio?: {
    value: number;
    mode: RatioMode;
  };
} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода векторной графики.
 */
export type VectorInitConfig<
  ComponentType extends Componentable = Vector,
  RefType extends StringOutputContextRef = StringOutputContextRef,
  PropertiesType extends VectorProperties = VectorProperties,
> = {
  mode?: VectorMode;
  flexItem?: FlexItemSpec;
  ratio?: {
    value: number;
    mode: RatioMode;
  };
} & OutputInitConfig<VectorValue, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends StringOutputContextRef> =
  VectorInitConfig<Vector, RefType>;

type VectorValueOrRef<RefType extends StringOutputContextRef> =
  | VectorValue
  | CompatibleOutputRef<VectorValue, RefType>;

export function vector<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: VectorValueOrRef<RefType>,
): Vector<RefType>;
export function vector<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(valueOrRef: VectorValueOrRef<RefType>): Vector<RefType>;
export function vector<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(config: VectorInitConfig<Vector, RefType>): Vector<RefType>;
export function vector<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  arg0:
    | VectorValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | VectorInitConfig<Vector, RefType>,
  arg1?: VectorValueOrRef<RefType>,
): Vector<RefType> {
  if (arg1 !== undefined) {
    return new Vector<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as VectorInitConfig<Vector, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "string" || single instanceof ContextRef) {
    return new Vector<RefType>(
      outputValueRefToConfig(single, {}) as VectorInitConfig<Vector, RefType>,
    );
  }
  return new Vector<RefType>(single as VectorInitConfig<Vector, RefType>);
}

/**
 * Компонент для вывода векторной графики (SVG).
 */
export class Vector<
    RefType extends StringOutputContextRef = StringOutputContextRef,
    PropertiesType extends VectorProperties = VectorProperties,
  >
  extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Vector;
  }

  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      mode: initValues.mode ?? VectorMode.Native,
      flexItem: normalizeFlexItem(initValues.flexItem),
      ratio: initValues.ratio,
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
