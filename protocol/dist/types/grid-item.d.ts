export type GridLine = number | "auto" | {
    span: number;
};
export type GridItem = {
    columnStart?: GridLine;
    columnEnd?: GridLine;
    rowStart?: GridLine;
    rowEnd?: GridLine;
};
