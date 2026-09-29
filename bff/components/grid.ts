import { GridColumnSize } from "@matreshka/shared/enums/grid-column-size";
import { GridTemplateColumns } from "@matreshka/shared/enums/grid-template-columns";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import {
  normalizeFlexItem,
  type FlexItemSpec,
} from "@matreshka/shared/types/flex-item";
import type { GridConfig } from "@matreshka/shared/types/grid-config";
import type { GridGap } from "@matreshka/shared/types/grid-gap";
import {
  calculateComponents,
  Componentable,
  ComponentTreeNode,
  serializeComponentList,
  StandaloneComponent,
} from "../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "./component";
import { ComponentSequence } from "./types/component-sequence";

type GridTemplateColumnValue = number | { min: number; max: number };

type GridTemplateColumnsValue =
  | GridTemplateColumns
  | GridTemplateColumnValue
  | (GridColumnSize | number | { min: number; max: number })[];

export type GridProperties = {
  content: ComponentSequence<unknown, ComponentTreeNode>;
  /**
   * Настройка столбцов: размер каждого столбца, либо {@link GridTemplateColumns.Subgrid}
   * для наследования дорожек родительской grid.
   */
  columns: GridTemplateColumnsValue;
  /**
   * Промежуток между строками и столбцами (число) либо отдельные значения через объект.
   */
  gap?: GridGap;
  /**
   * Поведение flex-item внутри родительского stack: `{ grow }`, `{ basis }` или явные поля.
   */
  flexItem?: FlexItemSpec;
  surface?: boolean;
} & ComponentProperties;

/**
 * Конфигурация инициализации для компонента `Grid`.
 *
 * @property content Набор ячеек сетки.
 * @property columns Настройка столбцов, для каждого столбца указывается его размер либо числом, либо диапазоном. Значения больше единицы будут конвертированы в rem, а меньше единицы в fr (аналог CSS grid-template-columns)
 * @property gap Промежуток между элементами сетки: число или `{ row?, column? }`.
 * @property flexItem Поведение flex-item внутри родительского stack.
 * @property surface Фон контейнера
 */
export type GridInitConfig<
  ComponentType extends Componentable = Grid,
  PropertiesType extends GridProperties = GridProperties,
> = {
  content: ComponentSequence<unknown, ComponentTreeNode>;
  columns: GridTemplateColumnsValue;
  gap?: GridGap;
  flexItem?: FlexItemSpec;
  surface?: boolean;
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultGridInitConfigType = GridInitConfig<Grid>;

export function grid(
  options: Omit<DefaultGridInitConfigType, "content">,
  content: DefaultGridInitConfigType["content"],
): Grid;
export function grid(config: DefaultGridInitConfigType): Grid;
export function grid(
  arg0: Omit<DefaultGridInitConfigType, "content"> | DefaultGridInitConfigType,
  arg1?: DefaultGridInitConfigType["content"],
): Grid {
  if (arg1 !== undefined) {
    return new Grid({
      ...(arg0 as Omit<DefaultGridInitConfigType, "content">),
      content: arg1,
    });
  }
  return new Grid(arg0 as DefaultGridInitConfigType);
}

/**
 * Компонент сетки с произвольными standalone-дочерними элементами.
 */
export class Grid<
    InitConfigType extends GridInitConfig<any> = DefaultGridInitConfigType,
    PropertiesType extends GridProperties = GridProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  /**
   * Возвращает уникальный идентификатор класса компонента.
   *
   * @returns Строка `"grid"`.
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Grid;
  }

  /**
   * Указывает, что компонент является standalone.
   *
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Инициализирует свойства компонента.
   *
   * @param initValues Объект конфигурации инициализации.
   * @returns Объект со свойствами компонента.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(initValues.content),
      columns: initValues.columns,
      gap: initValues.gap,
      flexItem: normalizeFlexItem(initValues.flexItem),
      surface: initValues.surface,
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {
      ...overrides,
      content: overrides.content
        ? serializeComponentList(overrides.content as ComponentTreeNode[])
        : undefined,
    };
    if (overrides.flexItem !== undefined) {
      out.flexItem = normalizeFlexItem(overrides.flexItem);
    }
    return out;
  }

  serialize(): GridConfig {
    const result = super.serialize();
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.Grid,
      properties: {
        ...p,
        content: serializeComponentList(p.content as ComponentTreeNode[]),
      },
    };
  }
}
