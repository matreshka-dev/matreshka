import { Chart, ChartDataInput, ChartInitConfig, ChartType } from "./chart";

export function radarChart(
  options: Omit<ChartInitConfig<RadarChart>, "labels" | "datasets">,
  data: ChartDataInput,
): RadarChart;
export function radarChart(data: ChartDataInput): RadarChart;
export function radarChart(config: ChartInitConfig<Chart>): RadarChart;
export function radarChart(
  arg0:
    | ChartDataInput
    | Omit<ChartInitConfig<RadarChart>, "labels" | "datasets">
    | ChartInitConfig<Chart>,
  arg1?: ChartDataInput,
): RadarChart {
  if (arg1 !== undefined) {
    return new RadarChart({
      ...(arg0 as Omit<ChartInitConfig<RadarChart>, "labels" | "datasets">),
      ...arg1,
    } as ChartInitConfig<Chart>);
  }
  return new RadarChart(arg0 as ChartInitConfig<Chart>);
}

/**
 * Компонент радиальной (радарной) диаграммы.
 */
export class RadarChart extends Chart {
  /**
   * Возвращает тип графика.
   * @returns Тип графика "radar".
   */
  protected type(): ChartType {
    return ChartType.Radar;
  }
}
