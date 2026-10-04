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

type NumericValue = number;

/**
 * Свойства компонента вывода числа.
 */
export type NumberProperties = {} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода числа.
 */
export type NumberInitConfig<
  ComponentType extends Componentable = Number,
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
  PropertiesType extends NumberProperties = NumberProperties,
> = {} & OutputInitConfig<NumericValue, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends NumberOutputContextRef> =
  NumberInitConfig<Number, RefType>;

type NumberValueOrRef<RefType extends NumberOutputContextRef> =
  | NumericValue
  | CompatibleOutputRef<NumericValue, RefType>;

export function number<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: NumberValueOrRef<RefType>,
): Number<RefType>;
export function number<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(valueOrRef: NumberValueOrRef<RefType>): Number<RefType>;
export function number<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(config: NumberInitConfig<Number, RefType>): Number<RefType>;
export function number<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  arg0:
    | NumberValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | NumberInitConfig<Number, RefType>,
  arg1?: NumberValueOrRef<RefType>,
): Number<RefType> {
  if (arg1 !== undefined) {
    return new Number<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as NumberInitConfig<Number, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "number" || single instanceof ContextRef) {
    return new Number<RefType>(
      outputValueRefToConfig(single, {}) as NumberInitConfig<Number, RefType>,
    );
  }
  return new Number<RefType>(single as NumberInitConfig<Number, RefType>);
}

/**
 * Компонент для вывода числа. Поддерживает вывод вещественных чисел и разделение на порядки с учетом локали клиента
 *
 * Наследуется от {@link OutputComponent}.
 */
export class Number<
    RefType extends NumberOutputContextRef = NumberOutputContextRef,
    PropertiesType extends NumberProperties = NumberProperties,
  >
  extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  /**
   * Возвращает идентификатор типа вывода.
   *
   * @returns Строка "number".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Number;
  }

  /**
   * Инициализирует свойства компонента вывода текста.
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
