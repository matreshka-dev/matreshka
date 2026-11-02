import type { PaddingPx } from "./padding-px";

const sidesOnly: PaddingPx = { top: 8, start: 16, end: 16, bottom: 8 };
const horizontalWithTopBottom: PaddingPx = { horizontal: 16, bottom: 8 };
const verticalWithStartEnd: PaddingPx = { vertical: 12, start: 20 };
const bothAxes: PaddingPx = { vertical: 8, horizontal: 12 };

// @ts-expect-error horizontal и start в одном объекте
const horizontalWithStart: PaddingPx = { horizontal: 16, start: 20 };
// @ts-expect-error vertical и top в одном объекте
const verticalWithTop: PaddingPx = { vertical: 12, top: 4 };
// @ts-expect-error обе оси и явная сторона
const bothAxesWithSide: PaddingPx = { vertical: 16, horizontal: 8, end: 24 };

void sidesOnly;
void horizontalWithTopBottom;
void verticalWithStartEnd;
void bothAxes;
void horizontalWithStart;
void verticalWithTop;
void bothAxesWithSide;
