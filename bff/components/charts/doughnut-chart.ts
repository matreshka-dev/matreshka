import { Chart, ChartDataInput, ChartInitConfig, ChartType } from "./chart";

export function doughnutChart(
  options: Omit<ChartInitConfig<DoughnutChart>, "labels" | "datasets">,
  data: ChartDataInput,
): DoughnutChart;
export function doughnutChart(data: ChartDataInput): DoughnutChart;
export function doughnutChart(config: ChartInitConfig<Chart>): DoughnutChart;
export function doughnutChart(
  arg0:
    | ChartDataInput
    | Omit<ChartInitConfig<DoughnutChart>, "labels" | "datasets">
    | ChartInitConfig<Chart>,
  arg1?: ChartDataInput,
): DoughnutChart {
  if (arg1 !== undefined) {
    return new DoughnutChart({
      ...(arg0 as Omit<ChartInitConfig<DoughnutChart>, "labels" | "datasets">),
      ...arg1,
    } as ChartInitConfig<Chart>);
  }
  return new DoughnutChart(arg0 as ChartInitConfig<Chart>);
}

/**
 * Компонент круговой диаграммы с дыркой по центру (doughnut chart).
 */
export class DoughnutChart extends Chart {
  /**
   * Возвращает тип графика.
   * @returns Тип графика "doughnut".
   */
  protected type(): ChartType {
    return ChartType.Doughnut;
  }
}
