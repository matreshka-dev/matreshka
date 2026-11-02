export type RadiusPxCorners = {
    topStart?: number;
    topEnd?: number;
    bottomStart?: number;
    bottomEnd?: number;
};
export type RadiusPxSides = {
    all?: number;
    top?: number;
    bottom?: number;
    start?: number;
    end?: number;
};
export type RadiusPx = number | (RadiusPxCorners & RadiusPxSides) | undefined;
