export function stringIsUrl(value: string) {
  try {
    return !!new URL(value);
  } catch (_) {
    return false;
  }
}
