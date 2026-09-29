import { ChartType } from "@matreshka/shared/enums/chart-type";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import type { Componentable } from "../../core/types/componentable";
import { StandaloneComponent } from "../../core/types/standalone-component";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "../component";
export { ChartType } from "@matreshka/shared/enums/chart-type";

/**
 * Описание набора данных для графика.
 * @property label Название набора данных.
 * @property values Массив числовых значений.
 */
export type ChartDataset = {
  label: string;
} & { values: number[] };

/**
 * Свойства компонента графика.
 * @property type Тип графика.
 * @property colors Цвета, используемые в графике.
 */
export type ChartProperties = {
  type: ChartType;
  colors: `#${string}`[];
  labels: string[];
  datasets: ChartDataset[];
} & ComponentProperties;

/**
 * Конфигурация инициализации графика.
 * @property labels Подписи для значений, длина массива labels должна совпадать с длинной массива значений в datasets, иначе на график будет выведено только labels.length значений.
 * @property datasets Наборы данных.
 * @property colors Цвета графика в HEX-формате.
 */
export type ChartInitConfig<
  ComponentType extends Componentable = Chart,
  PropertiesType extends ChartProperties = ChartProperties,
> = {
  labels: string[];
  datasets: ChartDataset[];
  colors?: `#${string}`[];
} & ComponentInitConfig<ComponentType, PropertiesType>;

/**
 * Обязательные поля данных графика для фабрик: подписи и наборы.
 */
export type ChartDataInput = Pick<
  ChartInitConfig<Chart>,
  "labels" | "datasets"
>;

type DefaultInitConfigType = ChartInitConfig<Chart>;

/**
 * Абстрактный класс графика.
 * Определяет общее поведение графических компонентов.
 */
export abstract class Chart<
    InitConfigType extends ChartInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends ChartProperties = ChartProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  /**
   * Возвращает тип графика.
   */
  protected abstract type(): ChartType;

  /**
   * Возвращает признак, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Возвращает уникальный идентификатор класса компонента.
   * @returns Строка "chart".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Chart;
  }

  /**
   * Инициализирует свойства графика.
   * @param initValues Входные параметры конфигурации.
   * @returns Свойства графика.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      type: this.type(),
      colors: initValues.colors ?? [],
      labels: initValues.labels,
      datasets: initValues.datasets,
    };
  }
}
