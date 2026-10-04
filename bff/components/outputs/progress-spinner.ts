import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, ContextRef, StandaloneComponent } from "../../core";
import {
  CompatibleOutputRef,
  NumberOutputContextRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  outputValueRefToConfig,
} from "./output-component";

/**
 * Свойства компонента вывода прогресса.
 */
export type ProgressSpinnerProperties = {
  background?: boolean;
} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода числа.
 */
export type ProgressSpinnerInitConfig<
  ComponentType extends Componentable = ProgressSpinner,
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
  PropertiesType extends ProgressSpinnerProperties = ProgressSpinnerProperties,
> = {
  background?: boolean;
} & OutputInitConfig<number, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends NumberOutputContextRef> =
  ProgressSpinnerInitConfig<ProgressSpinner, RefType>;

type SpinnerValueOrRef<RefType extends NumberOutputContextRef> =
  | number
  | CompatibleOutputRef<number, RefType>;

export function progressSpinner<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: SpinnerValueOrRef<RefType>,
): ProgressSpinner<RefType>;
export function progressSpinner<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(valueOrRef: SpinnerValueOrRef<RefType>): ProgressSpinner<RefType>;
export function progressSpinner<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  config: ProgressSpinnerInitConfig<ProgressSpinner, RefType>,
): ProgressSpinner<RefType>;
export function progressSpinner<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  arg0:
    | SpinnerValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | ProgressSpinnerInitConfig<ProgressSpinner, RefType>,
  arg1?: SpinnerValueOrRef<RefType>,
): ProgressSpinner<RefType> {
  if (arg1 !== undefined) {
    return new ProgressSpinner<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as ProgressSpinnerInitConfig<ProgressSpinner, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "number" || single instanceof ContextRef) {
    return new ProgressSpinner<RefType>(
      outputValueRefToConfig(single, {}) as ProgressSpinnerInitConfig<
        ProgressSpinner,
        RefType
      >,
    );
  }
  return new ProgressSpinner<RefType>(
    single as ProgressSpinnerInitConfig<ProgressSpinner, RefType>,
  );
}

/**
 * Компонент для вывода прогресса.
 * @experimental TODO: Требуется доработка отображения в overlay.
 * Наследуется от {@link OutputComponent}.
 */
export class ProgressSpinner<
    RefType extends NumberOutputContextRef = NumberOutputContextRef,
    PropertiesType extends
      ProgressSpinnerProperties = ProgressSpinnerProperties,
  >
  extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.ProgressSpinner;
  }

  /**
   * Инициализирует свойства компонента вывода прогресса.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект свойств компонента.
   */
  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      background: initValues.background,
    };
  }
}
