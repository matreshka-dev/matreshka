/** Конфигурация одного BFF-сервера, известного gateway. */
export type BffServerConfig = {
  /** Числовая часть BFF-токена (до двоеточия). */
  id: string;
  /** Секретная часть BFF-токена (после двоеточия). */
  secret: string;
  /** Разрешённые applicationId; если не задано — берётся из `APPLICATION_ID_MAP`. */
  applicationIds?: readonly string[];
};

/** Начальная конфигурация gateway. */
export type GatewayConfig = {
  bffServers: BffServerConfig[];
};
