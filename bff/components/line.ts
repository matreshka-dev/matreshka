import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, StandaloneComponent } from "../core";
import {
  ComponentInitConfig as BaseComponentInitConfig,
  Component,
  ComponentProperties,
} from "./component";

/**
 * Свойства компонента Line.
 */
export type LineProperties = ComponentProperties & {
  /**
   * Толщина линии в пикселях (на клиенте преобразуется в rem).
   */
  size?: number;
  /**
   * Радиус скругления в пикселях (на клиенте преобразуется в rem).
   */
  radius?: number;
};

/**
 * Конфигурация инициализации для компонента Line.
 */
export type LineInitConfig<
  ComponentType extends Componentable = Line,
  PropertiesType extends LineProperties = LineProperties,
> = BaseComponentInitConfig<ComponentType, PropertiesType> & {
  size?: number;
  radius?: number;
};

type DefaultInitConfigType = LineInitConfig<Line>;

export const line = (options: LineInitConfig<Line> = {}): Line =>
  new Line(options);

/**
 * Компонент-линия, отображающий горизонтальную или вертикальную линию.
 */
export class Line<
    InitConfigType extends LineInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends LineProperties = LineProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      size: initValues.size,
      radius: initValues.radius,
    };
  }

  /**
   * Возвращает флаг, указывающий, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }
  /**
   * Возвращает уникальный идентификатор класса компонента.
   *
   * @returns Строка с именем CSS-класса.
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Line;
  }
}
