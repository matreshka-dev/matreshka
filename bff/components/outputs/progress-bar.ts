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
 * Свойства компонента полоски прогресса.
 */
export type ProgressBarProperties = {} & OutputProperties;

/**
 * Конфигурация инициализации компонента полоски прогресса.
 */
export type ProgressBarInitConfig<
  ComponentType extends Componentable = ProgressBar,
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
  PropertiesType extends ProgressBarProperties = ProgressBarProperties,
> = {} & OutputInitConfig<number, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends NumberOutputContextRef> =
  ProgressBarInitConfig<ProgressBar, RefType>;

type ProgressBarValueOrRef<RefType extends NumberOutputContextRef> =
  | number
  | CompatibleOutputRef<number, RefType>;

export function progressBar<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: ProgressBarValueOrRef<RefType>,
): ProgressBar<RefType>;
export function progressBar<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(valueOrRef: ProgressBarValueOrRef<RefType>): ProgressBar<RefType>;
export function progressBar<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(config: ProgressBarInitConfig<ProgressBar, RefType>): ProgressBar<RefType>;
export function progressBar<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  arg0:
    | ProgressBarValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | ProgressBarInitConfig<ProgressBar, RefType>,
  arg1?: ProgressBarValueOrRef<RefType>,
): ProgressBar<RefType> {
  if (arg1 !== undefined) {
    return new ProgressBar<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as ProgressBarInitConfig<ProgressBar, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "number" || single instanceof ContextRef) {
    return new ProgressBar<RefType>(
      outputValueRefToConfig(single, {}) as ProgressBarInitConfig<
        ProgressBar,
        RefType
      >,
    );
  }
  return new ProgressBar<RefType>(
    single as ProgressBarInitConfig<ProgressBar, RefType>,
  );
}

/**
 * Компонент для вывода полоски прогресса.
 * @experimental TODO: Требуется доработка отображения в overlay.
 * Наследуется от {@link OutputComponent}.
 */
export class ProgressBar<
    RefType extends NumberOutputContextRef = NumberOutputContextRef,
    PropertiesType extends ProgressBarProperties = ProgressBarProperties,
  >
  extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.ProgressBar;
  }

  /**
   * Инициализирует свойства компонента полоски прогресса.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект свойств компонента.
   */
  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
    };
  }
}
