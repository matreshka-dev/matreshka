export function stringIsExternalUrl(value: string) {
  let external = false;
  try {
    const url = new URL(value);
    if (url.origin !== window?.location.origin) {
      external = true;
    }
  } catch (e) {}
  return external;
}
