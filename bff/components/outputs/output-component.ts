import {
  Componentable,
  ContextRef,
  ContextRefValue,
  StandaloneComponent,
} from "../../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "../component";

/**
 * Конфигурация инициализации для компонента вывода.
 *
 * @template T Тип значения компонента.
 *
 * @property ref Ссылка на значение в контексте, откуда будет браться значение.
 * @property value Статическое значение.
 */
type RefCompatibleValue<ValueType> = Exclude<ValueType, ContextRef<any, any>>;

export type CompatibleOutputRef<
  ValueType,
  RefType extends ContextRef<any, any>,
> =
  RefCompatibleValue<ValueType> extends ContextRefValue<RefType>
    ? RefType
    : never;

export type OutputInitConfig<
  ValueType,
  ComponentType extends Componentable = OutputComponent,
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
  PropertiesType extends OutputProperties = OutputProperties,
> = ({ ref: CompatibleOutputRef<ValueType, RefType> } | { value: ValueType }) &
  ComponentInitConfig<ComponentType, PropertiesType>;

/**
 * Свойства компонента вывода.
 *
 * @property ref Ссылка на значение в контексте.
 */
export type OutputProperties = {
  value?: unknown;
  ref?: string;
} & ComponentProperties;

type DefaultInitConfigType<ValueType> = OutputInitConfig<
  ValueType,
  OutputComponent
>;

/**
 * Абстрактный базовый класс для компонентов вывода.
 *
 * @template InitConfigType Тип конфигурации инициализации компонента.
 * @template PropertiesType Тип свойств компонента.
 *
 * Реализует интерфейс StandaloneComponent.
 */
export abstract class OutputComponent<
    InitConfigType extends OutputInitConfig<
      unknown,
      any
    > = DefaultInitConfigType<unknown>,
    PropertiesType extends OutputProperties = OutputProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  /**
   * Возвращает флаг, указывающий, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Инициализирует свойства компонента на основе конфигурации.
   *
   * @param initValues Объект инициализации компонента.
   * @returns Объект свойств компонента.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      value:
        "value" in initValues
          ? initValues.value instanceof ContextRef
            ? initValues.value.toString()
            : initValues.value
          : undefined,
      ref: "ref" in initValues ? initValues.ref : undefined,
    };
  }
}

/**
 * Первая аргумент-мост для фабрик output: литерал `value` или экземпляр {@link ContextRef}.
 */
export function outputValueRefToConfig<TOpts extends object>(
  valueOrRef: unknown,
  opts: TOpts,
): TOpts & ({ ref: ContextRef<any, any> } | { value: unknown }) {
  if (valueOrRef instanceof ContextRef) {
    return { ...opts, ref: valueOrRef } as TOpts & {
      ref: ContextRef<any, any>;
    };
  }
  return { ...opts, value: valueOrRef } as TOpts & { value: unknown };
}
