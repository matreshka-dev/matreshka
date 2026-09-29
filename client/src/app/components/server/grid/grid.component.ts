import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { GridTemplateColumns } from '@shared/enums/grid-template-columns';
import type { GridConfig } from '@shared/types/grid-config';
import { rem } from '../../../utils/rem';
import { ServerComponent } from '../server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

@Component({
  selector: 'app-grid',
  imports: [forwardRef(() => ServerComponentsListComponent)],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'grid',
    '[class.surface]': 'config.properties.surface',
    '[style.grid-template-columns]': 'templateColumnsRule()',
    '[style.row-gap]': 'rowGapRule()',
    '[style.column-gap]': 'columnGapRule()',
  },
})
export class GridComponent
  extends ServerComponent<GridConfig>
  implements OnInit
{
  templateColumnsRule = signal<string>('');
  protected readonly rem = rem;

  protected rowGapRule(): string | undefined {
    const gap = this.config.properties.gap;
    if (gap == null) {
      return undefined;
    }
    return this.rem(typeof gap === 'number' ? gap : gap.row);
  }

  protected columnGapRule(): string | undefined {
    const gap = this.config.properties.gap;
    if (gap == null) {
      return undefined;
    }
    return this.rem(typeof gap === 'number' ? gap : gap.column);
  }
  private toCssSize(value: number): string {
    return value > 1 ? rem(value) : `${value}fr`;
  }

  override ngOnInit() {
    super.ngOnInit();
    this.templateColumnsRule.set(this.buildGridTemplateColumnsRule());
  }

  private buildGridTemplateColumnsRule(): string {
    const columns = this.config.properties.columns;

    if (columns === GridTemplateColumns.Subgrid) {
      return 'subgrid';
    }

    // Если columns - это число
    if (typeof columns === 'number') {
      return `repeat(auto-fit, ${this.toCssSize(columns)})`;
    }

    // Если columns - это объект { min, max }
    if (
      !Array.isArray(columns) &&
      typeof columns === 'object' &&
      'min' in columns &&
      'max' in columns
    ) {
      const min = this.toCssSize(columns.min);
      const max = this.toCssSize(columns.max);
      return `repeat(auto-fit, minmax(${min}, ${max}))`;
    }

    // Если columns - это массив
    return columns
      .map((column: (typeof columns)[number]) => {
        if (typeof column === 'number') {
          return this.toCssSize(column);
        }

        // Поддержка строковых значений-ключевых слов (GridColumnSize)
        if (typeof column === 'string') {
          return column;
        }

        const min = this.toCssSize(column.min);
        const max = this.toCssSize(column.max);
        return `minmax(${min}, ${max})`;
      })
      .join(' ');
  }
}
