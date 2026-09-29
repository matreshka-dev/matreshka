export function parseContextPath(path: string) {
  const firstDotIndex = path.indexOf(".");

  if (firstDotIndex === -1) {
    return {
      contextId: path,
      key: "",
    };
  }

  return {
    contextId: path.slice(0, firstDotIndex),
    key: path.slice(firstDotIndex + 1),
  };
}
