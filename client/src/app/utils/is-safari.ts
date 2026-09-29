export function isSafari() {
  const userAgentString = navigator.userAgent;
  let safariAgent = userAgentString.indexOf('Safari') > -1;
  const chromeAgent = userAgentString.indexOf('Chrome') > -1;
  // Discard Safari since it also matches Chrome
  if (chromeAgent && safariAgent) safariAgent = false;
  return safariAgent;
}
