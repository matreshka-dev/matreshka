import type { DimensionalUnit } from "../enums/dimensional-unit";

/**
 * Числовое значение с CSS-единицей измерения.
 * Подходит для анимаций, размеров stack и других размерных свойств.
 */
export type DimensionalValue = {
  value: number;
  unit: DimensionalUnit;
};
