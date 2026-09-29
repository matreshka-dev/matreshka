import { isPlatformServer } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { ChartType } from '@shared/enums/chart-type';
import type { ChartConfig } from '@shared/types/chart-config';
import type { Chart } from 'chart.js';
import { WINDOW } from '../../../tokens/window';
import { randomString } from '../../../utils/random-string';
import { ServerComponent } from '../server-component';

let chartJsModulePromise: Promise<typeof import('chart.js')> | undefined;

function loadChartJs() {
  chartJsModulePromise ??= import('chart.js').then((chartJs) => {
    const {
      Chart,
      LineController,
      BarController,
      DoughnutController,
      PieController,
      PolarAreaController,
      RadarController,
      CategoryScale,
      LinearScale,
      RadialLinearScale,
      PointElement,
      LineElement,
      BarElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
    } = chartJs;
    Chart.register(
      LineController,
      BarController,
      DoughnutController,
      PieController,
      PolarAreaController,
      RadarController,
      CategoryScale,
      LinearScale,
      RadialLinearScale,
      PointElement,
      LineElement,
      BarElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
    );
    return chartJs;
  });
  return chartJsModulePromise;
}

@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent
  extends ServerComponent<ChartConfig>
  implements AfterViewInit, OnDestroy
{
  chart?: Chart;
  tagId = 'chart-' + randomString();
  el = inject(ElementRef);
  platformId = inject(PLATFORM_ID);
  window = inject(WINDOW);
  override ngOnInit() {
    super.ngOnInit();
    if (!isPlatformServer(this.platformId)) {
      void loadChartJs().then(({ Chart }) => {
        Chart.defaults.borderColor = this.window
          .getComputedStyle(this.el.nativeElement)
          .getPropertyValue('--line-color');
      });
    }
    // this.componentHub.stateChange$
    //   .pipe(
    //     filter((message) => message.target === this.config.id),
    //     map((message) => message.payload),
    //     takeUntilDestroyed(this.destroyRef)
    //   )
    //   .subscribe((state) => {
    //     const labelsEntity = state.find((x: any) => x.key === 'labels');
    //     const datasetsEntity = state.find((x: any) => x.key === 'dataset');
    //     if (labelsEntity) {
    //       this.chart.data.labels = labelsEntity.value as any;
    //     }
    //     if (datasetsEntity) {
    //       this.chart.data.datasets = (datasetsEntity.value as any).map(
    //         (dataset: any, index: number) =>
    //           this.generateDataset(dataset, index)
    //       );
    //     }
    //     if (labelsEntity || datasetsEntity) {
    //       this.chart.update();
    //     }
    //   });
  }

  private generateDataset(response: any, index: number) {
    const defaultColors = ['#F56B8E', '#F5B76E', '#2CE2E2', '#2CE891'];
    const addAlpha = (color: string, opacity: number) => {
      // coerce values so it is between 0 and 1.
      const _opacity = Math.round(Math.min(Math.max(opacity ?? 1, 0), 1) * 255);
      return color + _opacity.toString(16).toUpperCase();
    };

    const colors = this.config.properties.colors.length
      ? this.config.properties.colors
      : defaultColors;
    return {
      label: response.label,
      data: response.values,
      borderWidth: 1,
      borderColor: colors[index % colors.length],
      backgroundColor: addAlpha(colors[index % colors.length], 0.4),
    };
  }

  override ngOnDestroy() {
    this.chart?.destroy();
    super.ngOnDestroy();
  }

  private chartOptionsForType(type: ChartType) {
    if (type === ChartType.Line || type === ChartType.Bar) {
      return {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      };
    }
    return {};
  }

  override async ngAfterViewInit() {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    const { Chart } = await loadChartJs();
    this.chart = new Chart(this.tagId, {
      type: this.config.properties.type,
      data: {
        labels: this.config.properties.labels,
        datasets: this.config.properties.datasets.map((dataset, index) =>
          this.generateDataset(dataset, index),
        ),
      },
      options: this.chartOptionsForType(this.config.properties.type),
    });
    super.ngAfterViewInit();
  }
}
