import { OverlayAnchor } from '@shared/types/container-overlay';
import type { Overlay } from '../../server/server-component-config';

export type OverlayAnchorFlags = {
  top: boolean;
  bottom: boolean;
  middle: boolean;
  start: boolean;
  end: boolean;
  center: boolean;
};

export type OverlayDomBucket = 'before' | 'after';

export function overlayAnchorFlags(overlay: Overlay): OverlayAnchorFlags {
  const anchors = overlay.anchors ?? [];
  const has = (a: OverlayAnchor) => anchors.includes(a);

  const top = has(OverlayAnchor.Top);
  const bottom = has(OverlayAnchor.Bottom);
  const start = has(OverlayAnchor.Start);
  const end = has(OverlayAnchor.End);

  const middle = !(top && bottom) && has(OverlayAnchor.Middle);
  const center = !(start && end) && has(OverlayAnchor.Center);

  return { top, bottom, middle, start, end, center };
}

/** До или после основного содержимого в DOM (tab order). */
export function overlayDomBucket(flags: OverlayAnchorFlags): OverlayDomBucket {
  if (flags.top) {
    return 'before';
  }
  if (flags.bottom) {
    return 'after';
  }
  if (flags.middle) {
    return 'before';
  }
  if (flags.end && !flags.start) {
    return 'after';
  }
  return 'before';
}

function horizontalRank(flags: OverlayAnchorFlags): number {
  if (flags.start && !flags.end) {
    return 0;
  }
  if (flags.end && !flags.start) {
    return 2;
  }
  return 1;
}

function verticalRankBefore(flags: OverlayAnchorFlags): number {
  if (flags.top) {
    return 0;
  }
  if (flags.middle) {
    return 1;
  }
  return 2;
}

export function compareOverlayDomOrder(
  flagsA: OverlayAnchorFlags,
  flagsB: OverlayAnchorFlags,
  bucket: OverlayDomBucket,
  indexA: number,
  indexB: number,
): number {
  if (bucket === 'before') {
    const vDiff = verticalRankBefore(flagsA) - verticalRankBefore(flagsB);
    if (vDiff !== 0) {
      return vDiff;
    }
  }
  const hDiff = horizontalRank(flagsA) - horizontalRank(flagsB);
  if (hDiff !== 0) {
    return hDiff;
  }
  return indexA - indexB;
}

export function sortOverlaysForDom(
  overlays: ReadonlyArray<Overlay>,
  bucket: OverlayDomBucket,
): Overlay[] {
  const indexed = overlays.map((overlay, index) => ({
    overlay,
    index,
    flags: overlayAnchorFlags(overlay),
  }));
  const filtered = indexed.filter(
    (item) => overlayDomBucket(item.flags) === bucket,
  );
  filtered.sort((a, b) =>
    compareOverlayDomOrder(a.flags, b.flags, bucket, a.index, b.index),
  );
  return filtered.map((item) => item.overlay);
}
