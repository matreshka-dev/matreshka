import { ChartType } from "../enums/chart-type";
import { ServerComponentClass } from "../enums/server-component-class";
import type { ServerComponentConfig } from "./server-component-config";

export type ChartConfig = {
  class: ServerComponentClass.Chart;
  properties: {
    labels: string[];
    datasets: {
      label: string;
      values: number[];
    }[];
    type: ChartType;
    colors: `#${string}`[];
  };
} & ServerComponentConfig;
