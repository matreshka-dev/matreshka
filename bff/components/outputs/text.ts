import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { TextOutputAutolinkScheme } from "@matreshka/shared/enums/text-output-autolink-scheme";
import { TextOutputAutolinkTarget } from "@matreshka/shared/enums/text-output-autolink-target";
import { TextOutputProcessor } from "@matreshka/shared/enums/text-output-processor";
import type {
  TextOutputProcessorAutolinkConfig,
  TextOutputProcessorConfig,
  TextOutputProcessorLineBreaksConfig,
} from "@matreshka/shared/types/text-output-processor-config";
import { Componentable, ContextRef, StandaloneComponent } from "../../core";
import {
  CompatibleOutputRef,
  OutputComponent,
  OutputInitConfig,
  OutputProperties,
  outputValueRefToConfig,
} from "./output-component";

export { TextOutputAutolinkScheme } from "@matreshka/shared/enums/text-output-autolink-scheme";
export { TextOutputAutolinkTarget } from "@matreshka/shared/enums/text-output-autolink-target";
export { TextOutputProcessor } from "@matreshka/shared/enums/text-output-processor";

const DEFAULT_AUTOLINK_SCHEMES = [
  TextOutputAutolinkScheme.Http,
  TextOutputAutolinkScheme.Https,
  TextOutputAutolinkScheme.Mailto,
  TextOutputAutolinkScheme.Tel,
] as const;

/**
 * Свойства компонента вывода текста.
 */
export type TextProperties = {
  /**
   * Максимальное количество строк, которое может занимать текст.
   * При переполнении текст обрезается с многоточием.
   */
  maxLines?: number;
  processors?: TextOutputProcessorConfig[];
} & OutputProperties;

/**
 * Конфигурация инициализации компонента вывода текста.
 *
 */
export type TextInitConfig<
  ComponentType extends Componentable = Text,
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
  PropertiesType extends TextProperties = TextProperties,
> = {
  /**
   * Максимальное количество строк, которое может занимать текст.
   */
  maxLines?: number;
  processors?: TextOutputProcessorConfig[];
} & OutputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends ContextRef<any, any>> =
  TextInitConfig<Text, RefType>;

type TextValueOrRef<RefType extends ContextRef<any, any>> =
  | string
  | CompatibleOutputRef<string, RefType>;

export function lineBreaks(): TextOutputProcessorLineBreaksConfig {
  return {
    processor: TextOutputProcessor.LineBreaks,
  };
}

export function autolink(
  options: Omit<TextOutputProcessorAutolinkConfig, "processor"> = {},
): TextOutputProcessorAutolinkConfig {
  return {
    processor: TextOutputProcessor.Autolink,
    target: options.target ?? TextOutputAutolinkTarget.Blank,
    schemes: options.schemes ?? [...DEFAULT_AUTOLINK_SCHEMES],
  };
}

export function text<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(
  options: Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
  valueOrRef: TextValueOrRef<RefType>,
): Text<RefType>;
export function text<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(valueOrRef: TextValueOrRef<RefType>): Text<RefType>;
export function text<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(config: TextInitConfig<Text, RefType>): Text<RefType>;
export function text<
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
>(
  arg0:
    | TextValueOrRef<RefType>
    | Omit<DefaultInitConfigType<RefType>, "value" | "ref">
    | TextInitConfig<Text, RefType>,
  arg1?: TextValueOrRef<RefType>,
): Text<RefType> {
  if (arg1 !== undefined) {
    return new Text<RefType>(
      outputValueRefToConfig(
        arg1,
        arg0 as Omit<DefaultInitConfigType<RefType>, "value" | "ref">,
      ) as TextInitConfig<Text, RefType>,
    );
  }
  const single = arg0;
  if (typeof single === "string" || single instanceof ContextRef) {
    return new Text<RefType>(
      outputValueRefToConfig(single, {}) as TextInitConfig<Text, RefType>,
    );
  }
  return new Text<RefType>(single as TextInitConfig<Text, RefType>);
}

/**
 * Компонент для вывода текста.
 *
 * Наследуется от {@link OutputComponent}.
 */
export class Text<
    RefType extends ContextRef<any, any> = ContextRef<any, any>,
    PropertiesType extends TextProperties = TextProperties,
  >
  extends OutputComponent<TextInitConfig<Text, RefType>, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: TextInitConfig<Text, RefType>) {
    super(config);
  }

  /**
   * Возвращает идентификатор типа вывода.
   *
   * @returns Строка "text".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Text;
  }

  /**
   * Инициализирует свойства компонента вывода текста.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект свойств компонента.
   */
  protected initProperties(
    initValues: TextInitConfig<Text, RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      maxLines: initValues.maxLines,
      processors: initValues.processors,
    };
  }
}
