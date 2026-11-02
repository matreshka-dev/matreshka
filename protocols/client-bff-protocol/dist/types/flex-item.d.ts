import type { DimensionalValue } from "./dimensional-value";
export type FlexItemSpec = {
    basis?: number | DimensionalValue;
    grow?: number;
    shrink?: number;
};
export declare function isDimensionalValue(value: unknown): value is DimensionalValue;
export declare function isFlexItemSpec(value: unknown): value is FlexItemSpec;
export declare function normalizeFlexItem(flexItem: FlexItemSpec | undefined): FlexItemSpec | undefined;
