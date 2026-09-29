import { Chart, ChartDataInput, ChartInitConfig, ChartType } from "./chart";

export function barChart(
  options: Omit<ChartInitConfig<BarChart>, "labels" | "datasets">,
  data: ChartDataInput,
): BarChart;
export function barChart(data: ChartDataInput): BarChart;
export function barChart(config: ChartInitConfig<Chart>): BarChart;
export function barChart(
  arg0:
    | ChartDataInput
    | Omit<ChartInitConfig<BarChart>, "labels" | "datasets">
    | ChartInitConfig<Chart>,
  arg1?: ChartDataInput,
): BarChart {
  if (arg1 !== undefined) {
    return new BarChart({
      ...(arg0 as Omit<ChartInitConfig<BarChart>, "labels" | "datasets">),
      ...arg1,
    } as ChartInitConfig<Chart>);
  }
  return new BarChart(arg0 as ChartInitConfig<Chart>);
}

/**
 * Компонент столбчатой диаграммы.
 */
export class BarChart extends Chart {
  /**
   * Возвращает тип графика.
   * @returns Тип графика "bar".
   */
  protected type(): ChartType {
    return ChartType.Bar;
  }
}
