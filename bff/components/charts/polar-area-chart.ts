import { Chart, ChartDataInput, ChartInitConfig, ChartType } from "./chart";

export function polarAreaChart(
  options: Omit<ChartInitConfig<PolarAreaChart>, "labels" | "datasets">,
  data: ChartDataInput,
): PolarAreaChart;
export function polarAreaChart(data: ChartDataInput): PolarAreaChart;
export function polarAreaChart(config: ChartInitConfig<Chart>): PolarAreaChart;
export function polarAreaChart(
  arg0:
    | ChartDataInput
    | Omit<ChartInitConfig<PolarAreaChart>, "labels" | "datasets">
    | ChartInitConfig<Chart>,
  arg1?: ChartDataInput,
): PolarAreaChart {
  if (arg1 !== undefined) {
    return new PolarAreaChart({
      ...(arg0 as Omit<ChartInitConfig<PolarAreaChart>, "labels" | "datasets">),
      ...arg1,
    } as ChartInitConfig<Chart>);
  }
  return new PolarAreaChart(arg0 as ChartInitConfig<Chart>);
}

/**
 * Компонент круговой диаграммы с радиальным распределением (polar area chart).
 */
export class PolarAreaChart extends Chart {
  /**
   * Возвращает тип графика.
   * @returns Тип графика "polarArea".
   */
  protected type(): ChartType {
    return ChartType.PolarArea;
  }
}
