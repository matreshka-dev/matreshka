import { Chart, ChartDataInput, ChartInitConfig, ChartType } from "./chart";

export function lineChart(
  options: Omit<ChartInitConfig<LineChart>, "labels" | "datasets">,
  data: ChartDataInput,
): LineChart;
export function lineChart(data: ChartDataInput): LineChart;
export function lineChart(config: ChartInitConfig<Chart>): LineChart;
export function lineChart(
  arg0:
    | ChartDataInput
    | Omit<ChartInitConfig<LineChart>, "labels" | "datasets">
    | ChartInitConfig<Chart>,
  arg1?: ChartDataInput,
): LineChart {
  if (arg1 !== undefined) {
    return new LineChart({
      ...(arg0 as Omit<ChartInitConfig<LineChart>, "labels" | "datasets">),
      ...arg1,
    } as ChartInitConfig<Chart>);
  }
  return new LineChart(arg0 as ChartInitConfig<Chart>);
}

/**
 * Компонент линейного графика.
 */
export class LineChart extends Chart {
  /**
   * Возвращает тип графика.
   * @returns Тип графика "line".
   */
  protected type(): ChartType {
    return ChartType.Line;
  }
}
