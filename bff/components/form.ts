import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import type { FormConfig } from "@matreshka/shared/types/form-config";
import {
  calculateComponents,
  Componentable,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  StandaloneComponent,
} from "../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
  ServerComponentAction,
} from "./component";

export type FormProperties = {
  content: ComponentTreeNode[];
} & ComponentProperties;

/**
 * Конфигурация инициализации для компонента Form.
 *
 * @property content Список вложенных компонентов.
 * @property onSubmit Действие, вызываемое при отправке формы.
 */
export type FormInitConfig<
  ComponentType extends Componentable = Form,
  PropertiesType extends FormProperties = FormProperties,
> = {
  content: MixedWithCallbacksArray<ComponentTreeNode>;
  onSubmit:
    | ServerComponentAction<ComponentType>
    | ServerComponentAction<ComponentType>[];
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = FormInitConfig<Form>;

export function form(
  options: Omit<DefaultInitConfigType, "content">,
  content: DefaultInitConfigType["content"],
): Form;
export function form(config: DefaultInitConfigType): Form;
export function form(
  arg0: Omit<DefaultInitConfigType, "content"> | DefaultInitConfigType,
  arg1?: DefaultInitConfigType["content"],
): Form {
  if (arg1 !== undefined) {
    return new Form({
      ...(arg0 as Omit<DefaultInitConfigType, "content">),
      content: arg1,
    });
  }
  return new Form(arg0 as DefaultInitConfigType);
}

/**
 * Компонент формы, содержащей вложенные компоненты и поддерживающей отправку.
 * Перед инстансм необходимо убедиться, что внутри формы есть кнопка с type = submit,
 * иначе обработка отправки формы не будет работать
 *
 * @template T Тип вложенных узлов дерева ({@link ComponentTreeNode}).
 */
export class Form<
    InitConfigType extends FormInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends FormProperties = FormProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  /**
   * Возвращает уникальный идентификатор класса компонента.
   *
   * @returns Строка "form".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Form;
  }

  /**
   * Возвращает флаг, указывающий, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Создает новый экземпляр формы.
   *
   * @param config Конфигурация инициализации формы.
   *
   * Компонент обеспечивает корректную работу сабмита по нажатию Enter и отображение
   * клавиатуры с кнопкой отправки на мобильных устройствах.
   *
   * Убедитесь, что внутри формы присутствует кнопка с type=submit.
   * Если кнопок нет — форма будет отправлена.
   */
  constructor(config: InitConfigType) {
    // Компонент нужен для корректной работы нажатия на Enter в форме и правильной клавиатуры на мобильных (с кнопкой сабмита)
    // Убедитесь, что внутри формы существует кнопка с type=submit
    // Логика сабмита передается в config.submit, при этом первая попавшаяся кнопка в форме, без указания type, считается тригерной (так работает и в обычном html form)
    // Если кнопка disabled, то форма не сабмитится, если кнопок нет вообще, то форма сабмитится
    super(config);
    this.bindActions("submit", config.onSubmit);
  }

  /**
   * Инициализирует свойства компонента.
   *
   * @param initValues Объект конфигурации инициализации.
   * @returns Объект со свойствами компонента.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(initValues.content),
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    return {
      ...overrides,
      content: overrides.content
        ? serializeComponentList(overrides.content)
        : undefined,
    };
  }

  serialize(): FormConfig {
    const result = super.serialize();
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.Form,
      properties: {
        ...p,
        content: serializeComponentList(p.content),
      },
    };
  }
}
