export async function loadScript(document: any, url: string) {
  return new Promise<void>((resolve) => {
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = async () => {
      resolve();
    };
    head.appendChild(script);
  });
}
