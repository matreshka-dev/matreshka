import {
  AppReconnectInfoMessage,
  AppReloadMessage,
  HandshakeMessage,
} from "@matreshka/shared/messages/bff-to-client/app/index";
import { HandshakeMessage as ClientHandshakeMessage } from "@matreshka/shared/messages/client-to-bff/app/handshake-message";
import * as crypto from "crypto";
import { filter, Subject, Subscription, take } from "rxjs";
import { Client } from "./client";
import { GatewayConnection } from "./gateway-connection";
import { Router } from "./router";
import { ClientSettings } from "./types/client-settings";
import { serializeClientSettingsColorsForHandshake } from "./utils/serialize-client-settings-colors-for-handshake";

const CLIENT_DESTROY_TIMEOUT_MS = 15 * 60 * 1000; // 15 минут

export type ClientSettingsResolver = (applicationId: string) => ClientSettings;

/**
 * Основной класс приложения, управляющий жизненным циклом клиентов и маршрутизацией.
 */
export class Matreshka {
  private _clients: Map<string, Client> = new Map();
  readonly router = new Router();
  private readonly instanceId = crypto.randomUUID();
  private destroyTimers = new Map<string, NodeJS.Timeout>();
  private destroyTimeout = CLIENT_DESTROY_TIMEOUT_MS;
  private pendingHandshakeSubscriptions = new WeakMap<Client, Subscription>();
  readonly clientConnect$ = new Subject<Client>();
  readonly clientReconnect$ = new Subject<Client>();
  readonly clientDisconnect$ = new Subject<Client>();
  readonly clientDestroy$ = new Subject<Client>();

  /**
   * Создает экземпляр Matreshka.
   *
   */
  constructor() {
    this.clientReconnect$.subscribe((client) => {
      client.reconnect$.next();
    });
    this.clientDisconnect$.subscribe((client) => {
      client.disconnect$.next();
      const entry = [...this._clients.entries()].find((x) => x[1] === client);
      if (entry) {
        const token = entry[0];
        this.destroyTimers.set(
          token,
          setTimeout(() => {
            this._clients.delete(token);
            client.destroy();
            this.clientDestroy$.next(client);
          }, this.destroyTimeout),
        );
      }
      // Запуск таймера удаления
    });
  }

  /**
   * Получает клиента по параметрам запроса. Если клиент найден — возвращает его,
   * иначе создает нового клиента из состояния.
   *
   * @param params Параметры URL, содержащие токен и сериализованное состояние.
   * @returns Экземпляр клиента.
   */
  getClient(params: URLSearchParams): Client {
    const token = params.get("token");
    return token && this._clients.has(token)
      ? this._clients.get(token)!
      : new Client();
  }

  /**
   * Возвращает клиента по токену, если он существует.
   *
   * @param token Уникальный токен клиента.
   * @returns Экземпляр клиента или undefined.
   */
  findClient(token: string) {
    return this._clients.get(token);
  }

  /**
   * Подключает BFF к gateway по WebSocket.
   *
   * @param serverUrl Адрес gateway (`ws://127.0.0.1:3002` или с path `/bff`).
   * @param token Токен BFF из конфигурации gateway (`id:secret`).
   * @param resolveClientSettings Настройки для BFF handshake по `applicationId`.
   *
   * Версия пакета `@matreshka/bff` добавляется в query автоматически.
   */
  connectGateway(
    serverUrl: string,
    token: string,
    resolveClientSettings: ClientSettingsResolver,
  ): GatewayConnection {
    return new GatewayConnection(this, {
      url: serverUrl,
      token,
      resolveClientSettings,
    });
  }

  /**
   * Инициализирует клиента: либо подключает нового, либо обрабатывает реконнект.
   *
   * @param client Экземпляр клиента.
   * @param params Параметры URL (могут содержать token).
   * @param resolveClientSettings Настройки для BFF handshake по `applicationId`.
   */
  initClient(
    client: Client,
    params: URLSearchParams,
    resolveClientSettings: ClientSettingsResolver,
  ) {
    const token = params.get("token"); // Токен передается только при реконнекте
    const needReload = token && !this._clients.has(token);

    if (token && this.destroyTimers.has(token)) {
      // Отмена удаления клиента по таймауту, так как он подключился
      clearTimeout(this.destroyTimers.get(token));
      this.destroyTimers.delete(token);
      this.clientReconnect$.next(client);
    }

    if (token) {
      // Реконнект нужен в случае если по какой-то причине на клиенте отключился сокет (бывает из-за настроек NGINX, возможно отключается при потере сети на телефоне)
      if (needReload) {
        // Данные клиента удалены из памяти, нужно перезагрузить страницу
        this.clientDisconnect$.next(client);
        const message = new AppReloadMessage();
        client.outcomingMessage$.next(message);
      } else {
        // Отправка id текущего инстанса чтобы клиент был уверен, что версия сервера не изменилась
        const message = new AppReconnectInfoMessage({
          serverInstanceId: this.instanceId,
        });
        client.outcomingMessage$.next(message);
      }
    } else {
      this.clientConnect$.next(client);
      this.waitForClientHandshake(client, resolveClientSettings);
    }
  }

  private waitForClientHandshake(
    client: Client,
    resolveSettings: ClientSettingsResolver,
  ) {
    this.pendingHandshakeSubscriptions.get(client)?.unsubscribe();

    const subscription = client.incomingMessage$
      .pipe(
        filter(
          (message): message is ClientHandshakeMessage =>
            message instanceof ClientHandshakeMessage,
        ),
        take(1),
      )
      .subscribe((message) => {
        this.pendingHandshakeSubscriptions.delete(client);
        this.sendHandshake(
          client,
          resolveSettings(message.payload.applicationId),
          message.payload.applicationId,
        );
      });

    this.pendingHandshakeSubscriptions.set(client, subscription);
  }

  private sendHandshake(
    client: Client,
    settings: ClientSettings,
    applicationId: string,
  ) {
    const newClientToken = crypto.randomUUID();
    client.applicationId$.next(applicationId);
    this._clients.set(newClientToken, client);
    const message = new HandshakeMessage({
      serverInstanceId: this.instanceId,
      token: newClientToken,
      clientDestroyTimeoutMs: CLIENT_DESTROY_TIMEOUT_MS,
      settings: {
        ...settings,
        colors: serializeClientSettingsColorsForHandshake(settings.colors),
      },
    });
    client.outcomingMessage$.next(message);
  }
}
