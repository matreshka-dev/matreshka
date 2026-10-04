import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, ContextRef, StandaloneComponent } from "../../core";
import {
  CompatibleOutputRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  StringOutputContextRef,
  outputValueRefToConfig,
} from "./output-component";

/**
 * Параметры форматирования даты и времени.
 *
 * Соответствуют параметрам {@link Intl.DateTimeFormatOptions}.
 */
export type DateTimeOptions = {
  timeZone?: string;
  weekday?: "long" | "short" | "narrow";
  era?: "long" | "short" | "narrow";
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  day?: "numeric" | "2-digit";
  hour?: "numeric" | "2-digit";
  minute?: "numeric" | "2-digit";
  second?: "numeric" | "2-digit";
  timeZoneName?:
    | "long"
    | "short"
    | "shortOffset"
    | "longOffset"
    | "shortGeneric"
    | "longGeneric";
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
};

/**
 * Свойства компонента вывода даты и времени.
 *
 * @property locales Список локалей.
 * @property options Параметры форматирования даты и времени.
 */
export type DatetimeProperties = {
  locales?: string[];
  options?: DateTimeOptions;
} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода даты и времени.
 *
 * @property locales Список локалей для форматирования.
 * @property options Параметры форматирования даты и времени.
 */
export type DatetimeInitConfig<
  ComponentType extends Componentable = Datetime,
  RefType extends StringOutputContextRef = StringOutputContextRef,
  PropertiesType extends DatetimeProperties = DatetimeProperties,
> = {
  locales?: string[];
  options?: DateTimeOptions;
} & OutputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends StringOutputContextRef> =
  DatetimeInitConfig<Datetime, RefType>;

type DatetimeValueOrRef<RefType extends StringOutputContextRef> =
  | string
  | CompatibleOutputRef<string, RefType>;

export function datetime<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: DatetimeValueOrRef<RefType>,
): Datetime<RefType>;
export function datetime<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(valueOrRef: DatetimeValueOrRef<RefType>): Datetime<RefType>;
export function datetime<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(config: DatetimeInitConfig<Datetime, RefType>): Datetime<RefType>;
export function datetime<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  arg0:
    | DatetimeValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | DatetimeInitConfig<Datetime, RefType>,
  arg1?: DatetimeValueOrRef<RefType>,
): Datetime<RefType> {
  if (arg1 !== undefined) {
    return new Datetime<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as DatetimeInitConfig<Datetime, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "string" || single instanceof ContextRef) {
    return new Datetime<RefType>(
      outputValueRefToConfig(single, {}) as DatetimeInitConfig<
        Datetime,
        RefType
      >,
    );
  }
  return new Datetime<RefType>(single as DatetimeInitConfig<Datetime, RefType>);
}

/**
 * Компонент вывода отформатированной даты и времени.
 *
 * Наследуется от {@link OutputComponent} и реализует {@link StandaloneComponent}.
 */
export class Datetime<
    RefType extends StringOutputContextRef = StringOutputContextRef,
    PropertiesType extends DatetimeProperties = DatetimeProperties,
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
   * @returns Строка "datetime".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Datetime;
  }
  /**
   * Инициализирует свойства компонента на основе конфигурации.
   *
   * @param initValues Объект начальной конфигурации компонента.
   * @returns Свойства компонента с локалью и параметрами форматирования.
   */
  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      locales: initValues.locales,
      options: initValues.options,
    };
  }
}
