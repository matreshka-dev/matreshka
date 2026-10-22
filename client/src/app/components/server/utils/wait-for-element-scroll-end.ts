/** Дожидается окончания smooth-scroll или сразу resolve для instant. */
export function waitForElementScrollEnd(
  element: HTMLElement,
  smooth: boolean,
): Promise<void> {
  if (!smooth) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      element.removeEventListener('scrollend', onScrollEnd);
      clearTimeout(fallback);
      resolve();
    };
    const onScrollEnd = () => finish();
    element.addEventListener('scrollend', onScrollEnd);
    const fallback = setTimeout(finish, 500);
  });
}
