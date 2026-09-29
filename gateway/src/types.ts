import type { BffConnection } from "./bff-connection";

export type {
  BffServerConfig,
  GatewayConfig,
} from "./config/bff-server-config";

/** Снимок активного BFF-подключения для наблюдателей. */
export type ActiveBffInfo = {
  id: string;
  version: string;
  applicationIds: readonly string[];
  connectedAt: number;
};

/** Параметры подключения клиента. */
export type OpenClientSessionOptions = {
  /** Client token из URL query для reconnect без повторного client handshake. */
  reconnectToken?: string;
};

/** Данные для авторизации BFF при подключении к gateway. */
export type ConnectBffInput = {
  token: string;
  version: string;
};

/** Результат попытки подключения BFF. */
export type ConnectBffResult =
  | { ok: true; bff: BffConnection }
  | { ok: false; error: string };
