import { Chart, ChartDataInput, ChartInitConfig, ChartType } from "./chart";

export function pieChart(
  options: Omit<ChartInitConfig<PieChart>, "labels" | "datasets">,
  data: ChartDataInput,
): PieChart;
export function pieChart(data: ChartDataInput): PieChart;
export function pieChart(config: ChartInitConfig<Chart>): PieChart;
export function pieChart(
  arg0:
    | ChartDataInput
    | Omit<ChartInitConfig<PieChart>, "labels" | "datasets">
    | ChartInitConfig<Chart>,
  arg1?: ChartDataInput,
): PieChart {
  if (arg1 !== undefined) {
    return new PieChart({
      ...(arg0 as Omit<ChartInitConfig<PieChart>, "labels" | "datasets">),
      ...arg1,
    } as ChartInitConfig<Chart>);
  }
  return new PieChart(arg0 as ChartInitConfig<Chart>);
}

/**
 * Компонент круговой диаграммы.
 */
export class PieChart extends Chart {
  /**
   * Возвращает тип графика.
   * @returns Тип графика "pie".
   */
  protected type(): ChartType {
    return ChartType.Pie;
  }
}
