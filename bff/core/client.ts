import {
  getDeviceTypeFromUserAgent,
  getOsNameFromUserAgent,
} from "@matreshka/shared";
import { BrowserEngine } from "@matreshka/shared/enums/browser-engine";
import { BrowserName } from "@matreshka/shared/enums/browser-name";
import { DeviceType } from "@matreshka/shared/enums/device-type";
import { OsName } from "@matreshka/shared/enums/os-name";
import { PlatformId } from "@matreshka/shared/enums/platform-id";
import {
  AnyBffToClientMessage,
  BffToClientMessage,
} from "@matreshka/shared/messages/bff-to-client/bff-to-client-message";
import { BffToClientMessageReceivedMessage } from "@matreshka/shared/messages/bff-to-client/message-received-message";
import { AppClientStateMessage } from "@matreshka/shared/messages/client-to-bff/app/app-client-state-message";
import { HandshakeMessage as ClientHandshakeMessage } from "@matreshka/shared/messages/client-to-bff/app/handshake-message";
import {
  AnyClientToBffMessage,
  ClientToBffMessage,
} from "@matreshka/shared/messages/client-to-bff/client-to-bff-message";
import { ClientToBffMessageReceivedMessage } from "@matreshka/shared/messages/client-to-bff/message-received-message";
import { parseClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/parse-client-to-bff-message";
import { ReliableDelivery } from "@matreshka/shared/messages/reliable-delivery";
import { ClientState } from "@matreshka/shared/types/client-state";
import { BehaviorSubject, filter, Subject } from "rxjs";
import { z } from "zod/v4";
import { Page } from "../components";
import { App } from "../components/app";
import { Component } from "../components/component";
import { runWithClient } from "./client-context";
import { ClientStorage } from "./client-storage";
import { ComponentInstance } from "./types/component-instance";
import {
  type ComponentTreeNode,
  isComponentInstance,
} from "./types/component-tree-node";
import { incomingMessageObserver } from "./utils/incoming-message-observer";

const resolveOsNameFromUserAgent = getOsNameFromUserAgent as unknown as (
  userAgent: string,
) => OsName;
const resolveDeviceTypeFromUserAgent =
  getDeviceTypeFromUserAgent as unknown as (userAgent: string) => DeviceType;

/**
 * Схема состояния клиента, определяющая структуру и типы данных, передаваемых от клиента.
 *
 * @property route Информация о маршруте.
 * @property route.visitedAt Временная метка последнего посещения.
 * @property route.path Путь текущего маршрута.
 * @property route.query Параметры запроса в виде пар ключ-значение.
 * @property storage Клиентское хранилище в виде словаря строк.
 * @property language Текущий язык интерфейса.
 * @property userAgent Строка User-Agent в исходном виде, как ее отдает браузер.
 * @property prefersColorScheme Предпочтительная цветовая схема клиента: "light" или "dark".
 * @property platform Информация о платформе клиента.
 * @property platform.id Идентификатор платформы.
 * @property platform.payload Дополнительные данные о платформе.
 */
export const ClientHandshakePayloadSchema = z.strictObject({
  applicationId: z.string(),
});

export const ClientStateSchema = z.strictObject({
  route: z.strictObject({
    visitedAt: z.number(),
    path: z.string(),
    query: z.record(z.string(), z.string()),
  }),
  storage: z.record(z.string(), z.string()),
  language: z.string(),
  userAgent: z.string(),
  prefersColorScheme: z.literal(["light", "dark", "system"]),
  platform: z.strictObject({
    id: z.enum(PlatformId),
    payload: z.unknown(),
  }),
});

export class Client {
  incomingMessage$ = new Subject<AnyClientToBffMessage>();
  outcomingMessage$ = new Subject<AnyBffToClientMessage>();
  ping$ = new BehaviorSubject<number | undefined>(undefined);
  reconnect$ = new Subject<void>();
  disconnect$ = new Subject<void>();
  destroy$ = new Subject<void>();
  error$ = new Subject<unknown>();
  app = new App({});
  /**
   * Id страницы, для которой при навигации нужно снять обработчики предыдущей страницы.
   * Диалоги/popover/оверлеи сюда не входят — их снимают по AppDestroyEntryInstanceMessage или removeGlobalComponent.
   */
  private currentPageInstance?: ComponentInstance<Page>;
  private appOverlayEntry?: ComponentInstance<App>;
  private transportSend?: (message: BffToClientMessage) => void;
  private readonly reliableDelivery = new ReliableDelivery<
    ClientToBffMessage,
    BffToClientMessage
  >({
    emitOutgoing: (message) => this.outcomingMessage$.next(message),
    createReceipt: (payload) => new BffToClientMessageReceivedMessage(payload),
    isReceiptMessage: (message) =>
      message instanceof ClientToBffMessageReceivedMessage,
    ping$: this.ping$,
  });

  readonly state$: BehaviorSubject<ClientState>;
  readonly applicationId$ = new BehaviorSubject<string | undefined>(undefined);
  readonly storage = new ClientStorage(this);

  /**
   * Создает новый экземпляр клиента.
   *
   * @param initState Начальное состояние клиента.
   */
  constructor() {
    this.state$ = new BehaviorSubject(undefined as unknown as ClientState);
    this.outcomingMessage$.subscribe((message) => {
      this.reliableDelivery.observeOutgoing(message);
      this.forwardToTransport(message);
    });
    this.disconnect$.subscribe(() => {
      this.reliableDelivery.pause();
    });
    this.reconnect$.subscribe(() => {
      this.reliableDelivery.resume();
    });
    this.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) => unsafeMessage instanceof AppClientStateMessage,
        ),
      )
      .subscribe(
        incomingMessageObserver(this, (unsafeMessage) => {
          const messagePayload = ClientStateSchema.parse(unsafeMessage.payload);
          this.state$.next(messagePayload);
        }),
      );
    this.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage): unsafeMessage is ClientHandshakeMessage =>
            unsafeMessage instanceof ClientHandshakeMessage,
        ),
      )
      .subscribe(
        incomingMessageObserver(this, (unsafeMessage) => {
          const messagePayload = ClientHandshakePayloadSchema.parse(
            unsafeMessage.payload,
          );
          this.applicationId$.next(messagePayload.applicationId);
        }),
      );
  }

  /**
   * Подключает transport-слой для фактической отправки сообщений клиенту.
   *
   * Вызывается при каждом новом соединении; предыдущий transport снимается автоматически.
   */
  attachTransport(send: (message: BffToClientMessage) => void): void {
    this.detachTransport();
    this.transportSend = send;
  }

  /**
   * Отключает transport-слой без уничтожения клиента (grace period).
   */
  detachTransport(): void {
    delete this.transportSend;
  }

  /**
   * Entry instance для сериализации глобальных App-оверлеев (platform.setOverlays).
   */
  ensureAppOverlayEntry(): ComponentInstance<App> {
    if (!this.appOverlayEntry) {
      this.appOverlayEntry = runWithClient(this, () =>
        this.app.beginSerializationContext(),
      );
    }
    return this.appOverlayEntry;
  }

  /**
   * Завершает работу клиента и завершает потоки сообщений.
   */
  destroy() {
    this.detachTransport();
    this.reliableDelivery.destroy();
    this.incomingMessage$.complete();
    this.outcomingMessage$.complete();
    this.ping$.complete();
    this.applicationId$.complete();
    this.error$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Обрабатывает новое входящее сообщение в виде строки.
   *
   * @param messageString Строка с сериализованным сообщением.
   */
  newMessage(messageString: string) {
    try {
      const abstractMessageSchema = z.object({
        type: z.string(),
        payload: z.unknown().optional(),
        target: z.string().optional(),
        id: z.string().optional(),
        attempt: z.number().int().positive().optional(),
      });
      const message = abstractMessageSchema.parse(JSON.parse(messageString));
      runWithClient(this, () => {
        const nextMessage = this.reliableDelivery.handleIncoming(
          parseClientToBffMessage(message),
        );
        if (nextMessage) {
          this.incomingMessage$.next(nextMessage);
        }
      });
    } catch (error) {
      this.error$.next(error);
    }
  }

  /**
   * Переход на другую страницу: снимает обработчики с предыдущей страницы и запоминает id новой.
   */
  switchPage(newPageInstance: ComponentInstance<Page>): void {
    this.currentPageInstance?.component.releaseInstances([
      this.currentPageInstance,
    ]);
    this.currentPageInstance = newPageInstance;
  }

  /**
   * Снимает использования глобального компонента (оверлеи платформы и т.п.) для этого клиента.
   */
  removeGlobalComponent(node: ComponentTreeNode): void {
    if (isComponentInstance(node)) {
      (node.component as unknown as Component).releaseInstances([node]);
      return;
    }
    if (node instanceof Component) {
      node.releaseInstances(node.getInstances({ client: this }));
    }
  }

  browserVersion(): string | null {
    const userAgent = this.state$.getValue().userAgent;
    const patterns = [
      /Edg\/([\d.]+)/,
      /OPR\/([\d.]+)/,
      /Firefox\/([\d.]+)/,
      /Chrome\/([\d.]+)/,
      /Version\/([\d.]+).*Safari/,
    ];

    for (const pattern of patterns) {
      const match = userAgent.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  browserName(): BrowserName {
    const userAgent = this.state$.getValue().userAgent;
    const patterns: Array<[RegExp, BrowserName]> = [
      [/EdgiOS\/[\d.]+|Edg\/[\d.]+/, BrowserName.Edge],
      [/OPiOS\/[\d.]+|OPR\/[\d.]+/, BrowserName.Opera],
      [/YaBrowser\/[\d.]+/, BrowserName.YandexBrowser],
      [/SamsungBrowser\/[\d.]+/, BrowserName.SamsungInternet],
      [/FxiOS\/[\d.]+|Firefox\/[\d.]+/, BrowserName.Firefox],
      [/CriOS\/[\d.]+|Chrome\/[\d.]+/, BrowserName.Chrome],
      [/Version\/[\d.]+.*Safari/, BrowserName.Safari],
    ];

    for (const [pattern, browserFamily] of patterns) {
      if (pattern.test(userAgent)) {
        return browserFamily;
      }
    }

    return BrowserName.Unknown;
  }

  browserEngine(): BrowserEngine {
    const userAgent = this.state$.getValue().userAgent;

    if (/Firefox\/[\d.]+/.test(userAgent)) {
      return BrowserEngine.Gecko;
    }

    if (
      /iPhone|iPad|iPod/.test(userAgent) &&
      /AppleWebKit\/[\d.]+/.test(userAgent)
    ) {
      return BrowserEngine.WebKit;
    }

    if (
      /Chrome\/[\d.]+|Chromium\/[\d.]+|Edg\/[\d.]+|OPR\/[\d.]+|YaBrowser\/[\d.]+|SamsungBrowser\/[\d.]+/.test(
        userAgent,
      )
    ) {
      return BrowserEngine.Blink;
    }

    if (/AppleWebKit\/[\d.]+/.test(userAgent)) {
      return BrowserEngine.WebKit;
    }

    return BrowserEngine.Unknown;
  }

  osName(): OsName {
    return resolveOsNameFromUserAgent(this.state$.getValue().userAgent);
  }

  deviceType(): DeviceType {
    return resolveDeviceTypeFromUserAgent(this.state$.getValue().userAgent);
  }

  /**
   * Возвращает значение из клиентского хранилища по заданному ключу.
   *
   * @param key Ключ значения.
   * @returns Значение, если оно существует.
   * @deprecated Используйте {@link Client.storage.get}.
   */
  getStorageValue(key: string) {
    return this.storage.get(key);
  }

  /**
   * Устанавливает значение в клиентское хранилище и отправляет соответствующее сообщение.
   *
   * @param key Ключ значения.
   * @param value Значение или undefined для удаления.
   * @returns Ссылку на текущий экземпляр клиента.
   * @deprecated Используйте {@link Client.storage.set}.
   */
  setStorageValue(key: string, value: string | undefined) {
    this.storage.set(key, value);
    return this;
  }

  /**
   * Удаляет значение из хранилища по ключу.
   *
   * @param key Ключ для удаления.
   * @returns Ссылку на текущий экземпляр клиента.
   * @deprecated Используйте {@link Client.storage.clear}.
   */
  clearStorageValue(key: string) {
    this.storage.clear(key);
    return this;
  }

  private forwardToTransport(message: BffToClientMessage): void {
    this.transportSend?.(message);
  }
}
