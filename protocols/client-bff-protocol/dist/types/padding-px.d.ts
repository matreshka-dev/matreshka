export type PaddingPxSides = {
    top?: number;
    bottom?: number;
    start?: number;
    end?: number;
};
export type PaddingPxAxis = {
    vertical?: number;
    horizontal?: number;
};
type PaddingPxSidesOnly = PaddingPxSides & {
    vertical?: never;
    horizontal?: never;
};
type PaddingPxWithHorizontal = {
    horizontal: number;
    vertical?: never;
    top?: number;
    bottom?: number;
    start?: never;
    end?: never;
};
type PaddingPxWithVertical = {
    vertical: number;
    horizontal?: never;
    top?: never;
    bottom?: never;
    start?: number;
    end?: number;
};
type PaddingPxWithBothAxes = {
    vertical: number;
    horizontal: number;
    top?: never;
    bottom?: never;
    start?: never;
    end?: never;
};
export type PaddingPxObject = PaddingPxSidesOnly | PaddingPxWithHorizontal | PaddingPxWithVertical | PaddingPxWithBothAxes;
export type PaddingPx = number | PaddingPxObject | undefined;
export type PaddingPxWireObject = PaddingPxSides & PaddingPxAxis;
export type PaddingPxWire = number | PaddingPxWireObject | undefined;
export {};
