export function rem(px: number): string;
export function rem(px: number | undefined): string | undefined;
export function rem(px: number | undefined): string | undefined {
  if (px == null) {
    return undefined;
  }
  return `${px / 16}rem`;
}
