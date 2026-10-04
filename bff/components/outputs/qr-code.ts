import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, ContextRef } from "../../core";
import {
  CompatibleOutputRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  StringOutputContextRef,
  outputValueRefToConfig,
} from "./output-component";

export type QrCodeProperties = {} & OutputProperties;

/**
 * Конфигурация инициализации компонента QR-кода.
 */
export type QrCodeInitConfig<
  ComponentType extends Componentable = QrCode,
  RefType extends StringOutputContextRef = StringOutputContextRef,
  PropertiesType extends QrCodeProperties = QrCodeProperties,
> = {} & OutputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends StringOutputContextRef> =
  QrCodeInitConfig<QrCode, RefType>;

type QrValueOrRef<RefType extends StringOutputContextRef> =
  | string
  | CompatibleOutputRef<string, RefType>;

export function qrCode<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: QrValueOrRef<RefType>,
): QrCode<RefType>;
export function qrCode<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(valueOrRef: QrValueOrRef<RefType>): QrCode<RefType>;
export function qrCode<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(config: QrCodeInitConfig<QrCode, RefType>): QrCode<RefType>;
export function qrCode<
  RefType extends StringOutputContextRef = StringOutputContextRef,
>(
  arg0:
    | QrValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | QrCodeInitConfig<QrCode, RefType>,
  arg1?: QrValueOrRef<RefType>,
): QrCode<RefType> {
  if (arg1 !== undefined) {
    return new QrCode<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as QrCodeInitConfig<QrCode, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "string" || single instanceof ContextRef) {
    return new QrCode<RefType>(
      outputValueRefToConfig(single, {}) as QrCodeInitConfig<QrCode, RefType>,
    );
  }
  return new QrCode<RefType>(single as QrCodeInitConfig<QrCode, RefType>);
}

/**
 * Компонент для отображения QR-кода.
 */
export class QrCode<
  RefType extends StringOutputContextRef = StringOutputContextRef,
  PropertiesType extends QrCodeProperties = QrCodeProperties,
> extends OutputComponent<DefaultInitConfigType<RefType>, PropertiesType> {
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.QrCode;
  }

  /**
   * Инициализирует свойства компонента QR-кода.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект состояния компонента.
   */
  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
    };
  }
}
