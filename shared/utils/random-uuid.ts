type CryptoApi = {
  randomUUID: () => string;
};

// Этот fallback используется только когда проект запущен на протоколе http, а не https, в этом случае браузер блокирует использование crypto.randomUUID()
function randomUuidFallback(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function randomUuid(): string {
  const crypto = (globalThis as typeof globalThis & { crypto?: CryptoApi })
    .crypto;
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return randomUuidFallback();
}
