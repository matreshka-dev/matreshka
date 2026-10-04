import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, StandaloneComponent } from "../../core";
import {
  CompatibleOutputRef,
  NumberOutputContextRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  outputValueRefToConfig,
} from "./output-component";

/**
 * Конфигурация инициализации компонента валюты.
 *
 * @property color Цвет текста из палитры.
 */
export type CurrencyProperties = {
  /**
   * Код валюты (например, "USD", "EUR").
   */
  currency: string;
  /**
   * Минимальное количество целых разрядов.
   *
   * Прокидывается на клиент в `Intl.NumberFormat` как `minimumIntegerDigits`.
   */
  minIntegerDigits?: number;
  /**
   * Минимальное количество дробных разрядов.
   *
   * Прокидывается на клиент в `Intl.NumberFormat` как `minimumFractionDigits`.
   */
  minFractionDigits?: number;
  /**
   * Максимальное количество дробных разрядов.
   *
   * Прокидывается на клиент в `Intl.NumberFormat` как `maximumFractionDigits`.
   */
  maxFractionDigits?: number;
} & OutputProperties;

/**
 * Конфигурация инициализации компонента валюты.
 */
export type CurrencyInitConfig<
  ComponentType extends Componentable = Currency,
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
  PropertiesType extends CurrencyProperties = CurrencyProperties,
> = {
  currency: string;
  minIntegerDigits?: number;
  minFractionDigits?: number;
  maxFractionDigits?: number;
} & OutputInitConfig<number, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends NumberOutputContextRef> =
  CurrencyInitConfig<Currency, RefType>;

type CurrencyValueOrRef<RefType extends NumberOutputContextRef> =
  | number
  | CompatibleOutputRef<number, RefType>;

export function currency<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: CurrencyValueOrRef<RefType>,
): Currency<RefType>;
export function currency<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(config: CurrencyInitConfig<Currency, RefType>): Currency<RefType>;
export function currency<
  RefType extends NumberOutputContextRef = NumberOutputContextRef,
>(
  arg0:
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | CurrencyInitConfig<Currency, RefType>,
  arg1?: CurrencyValueOrRef<RefType>,
): Currency<RefType> {
  if (arg1 !== undefined) {
    return new Currency<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as CurrencyInitConfig<Currency, RefType>,
    );
  }
  return new Currency<RefType>(arg0 as CurrencyInitConfig<Currency, RefType>);
}

/**
 * Компонент отображения валюты.
 *
 * Представляет числовое значение с привязкой к конкретной валюте.
 * Поддерживает встроенное отображение.
 */
export class Currency<
    RefType extends NumberOutputContextRef = NumberOutputContextRef,
    PropertiesType extends CurrencyProperties = CurrencyProperties,
  >
  extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Currency;
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
      currency: initValues.currency,
      minIntegerDigits: initValues.minIntegerDigits,
      minFractionDigits: initValues.minFractionDigits,
      maxFractionDigits: initValues.maxFractionDigits,
    };
  }
}
