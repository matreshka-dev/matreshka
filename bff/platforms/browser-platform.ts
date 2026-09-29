import { BrowserAddEventToCalendarMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-add-event-to-calendar-message";
import { BrowserDownloadCsvContentMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-download-csv-content-message";
import { BrowserDownloadFileMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-download-file-message";
import { BrowserGetGeolocationMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-get-geolocation-message";
import { BrowserOpenFileMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-open-file-message";
import { BrowserRequestPushNotificationsMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-request-push-notifications-message";
import { BrowserShareMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-share-message";
import { PlatformWebAuthnCreateCredentialMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-webauthn-create-credential-message";
import { PlatformWebAuthnGetCredentialMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-webauthn-get-credential-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { BrowserGetGeolocationSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/browser/browser-get-geolocation-success-message";
import { BrowserRequestPushNotificationsActionGrantedMessage } from "@matreshka/shared/messages/client-to-bff/platforms/browser/browser-request-push-notifications-action-granted-message";
import { PlatformWebAuthnCreateCredentialSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-webauthn-create-credential-success-message";
import { PlatformWebAuthnGetCredentialSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-webauthn-get-credential-success-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { filter } from "rxjs";
import { z } from "zod/v4";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
import { WebPlatform } from "./web-platform";

const pushSubscriptionGrantedMessageSchema = z.strictObject({
  subscription: z.strictObject({
    endpoint: z.string(),
    expirationTime: z.number().nullable().optional(),
    keys: z.strictObject({
      auth: z.string(),
      p256dh: z.string(),
    }),
  }),
});

const errorMessagePayloadSchema = z.strictObject({
  message: z.string(),
});

/**
 * Платформа для браузерной версии клиента.
 *
 * Расширяет `WebPlatform`, добавляя методы для взаимодействия с API браузера.
 */
export class BrowserPlatform extends WebPlatform {
  /**
   * Запрашивает геолокацию пользователя в веб-клиенте.
   *
   * @param config Объект с обработчиками успешного получения геолокации и отмены.
   */
  getGeolocation(config: {
    onSuccess: (position: { latitude: number; longitude: number }) => void;
    onError?: (error: string) => void;
  }) {
    const scope = "platform-action-" + crypto.randomUUID();
    const subscription = this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) && unsafeMessage.target === scope,
        ),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          subscription.unsubscribe();
          if (unsafeMessage instanceof BrowserGetGeolocationSuccessMessage) {
            const messagePayload = z
              .strictObject({
                latitude: z.number(),
                longitude: z.number(),
              })
              .parse(unsafeMessage.payload);
            config.onSuccess(messagePayload);
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const messagePayload = errorMessagePayloadSchema.parse(
              unsafeMessage.payload,
            );
            if (typeof config.onError === "function") {
              config.onError(messagePayload.message);
            }
          }
        }),
      );
    this.client.outcomingMessage$.next(new BrowserGetGeolocationMessage(scope));
  }
  /**
   * Добавляет событие в календарь клиента.
   *
   * @param data Данные события: начало, конец, описание, место проведения и заголовок.
   */
  addEventToCalendar(data: {
    start: string | EpochTimeStamp;
    end?: string | EpochTimeStamp;
    summary: string;
    location?: string;
    description?: string;
  }) {
    this.client.outcomingMessage$.next(
      new BrowserAddEventToCalendarMessage(data),
    );
  }

  /**
   * Сохраняет CSV-файл на устройстве пользователя.
   *
   * @param filename Имя файла (будет добавлено расширение `.csv`, если не указано).
   * @param content Двумерный массив строк, представляющий содержимое CSV.
   */
  downloadCsvContent(filename: string, content: string[][]) {
    this.client.outcomingMessage$.next(
      new BrowserDownloadCsvContentMessage({
        filename: filename.endsWith(".csv") ? filename : filename + ".csv",
        content,
      }),
    );
  }

  /**
   * Инициирует загрузку файла по указанному URL.
   *
   * @param url Ссылка на файл.
   * @param filename Имя сохраняемого файла.
   */
  downloadFile(url: string, filename: string) {
    // https://developer.mozilla.org/ru/docs/Web/HTML/Element/a#Attributes
    // Принудительная загрузка файлов, которые браузер может открыть, а не скачать (изображения и pdf), будет только для того же домена, иначе будет срабатывать открытие, либо будет игнорировать приоритетный filename
    this.client.outcomingMessage$.next(
      new BrowserDownloadFileMessage({ url, filename }),
    );
  }

  /**
   * Открывает файл во встроенном просмотрщике браузера (PDF, изображения и т.д.).
   *
   * @param url Ссылка на файл (blob: или HTTP).
   */
  openFile(url: string) {
    this.client.outcomingMessage$.next(new BrowserOpenFileMessage({ url }));
  }

  /**
   * Делится содержимым через системное диалоговое окно обмена.
   *
   * @param data Объект с текстом, ссылкой и/или заголовком.
   */
  share(data: { url?: string; title?: string; text?: string }) {
    this.client.outcomingMessage$.next(new BrowserShareMessage(data));
  }

  /**
   * Запрашивает разрешение на push-уведомления и обрабатывает результат.
   *
   * @param config Объект с колбэками: `onGranted` при успехе, `onError` при ошибке.
   */
  registerPushNotifications(config: {
    publicKey: string;
    onGranted: (subscription: {
      endpoint: string;
      expirationTime?: EpochTimeStamp | null;
      keys: { auth: string; p256dh: string };
    }) => void;
    onError?: (text: string) => void;
  }) {
    const scope = "platform-action-" + crypto.randomUUID();
    const subscription = this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) && unsafeMessage.target === scope,
        ),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          subscription.unsubscribe();
          if (
            unsafeMessage instanceof
            BrowserRequestPushNotificationsActionGrantedMessage
          ) {
            const messagePayload = pushSubscriptionGrantedMessageSchema.parse(
              unsafeMessage.payload,
            );
            config.onGranted(messagePayload.subscription);
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const messagePayload = errorMessagePayloadSchema.parse(
              unsafeMessage.payload,
            );
            if ("onError" in config) {
              config.onError!(messagePayload.message);
            }
          }
        }),
      );
    this.client.outcomingMessage$.next(
      new BrowserRequestPushNotificationsMessage(scope, {
        publicKey: config.publicKey,
      }),
    );
  }

  /**
   * Регистрация WebAuthn credential (passkey / security key) в браузерном клиенте.
   *
   * @remarks Только `BrowserPlatform` / `PwaPlatform`. Mobile — не поддерживается.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
   */
  createWebAuthnCredential(config: {
    optionsJSON: PublicKeyCredentialCreationOptionsJSON;
    onSuccess: (credentialJSON: RegistrationResponseJSON) => void;
    onError?: (text: string) => void;
  }) {
    this.runWebAuthnPlatformAction({
      target: "platform-action-" + crypto.randomUUID(),
      successMessageType: PlatformWebAuthnCreateCredentialSuccessMessage,
      outgoingMessage: (target) =>
        new PlatformWebAuthnCreateCredentialMessage(target, {
          optionsJSON: config.optionsJSON,
        }),
      parseSuccessPayload: (payload) =>
        webAuthnRegistrationResponseSchema.parse(payload),
      onSuccess: (payload) =>
        config.onSuccess(
          payload.credentialJSON as unknown as RegistrationResponseJSON,
        ),
      onError: config.onError,
    });
  }

  /**
   * Аутентификация через WebAuthn credential в браузерном клиенте.
   */
  getWebAuthnCredential(config: {
    optionsJSON: PublicKeyCredentialRequestOptionsJSON;
    onSuccess: (credentialJSON: AuthenticationResponseJSON) => void;
    onError?: (text: string) => void;
  }) {
    this.runWebAuthnPlatformAction({
      target: "platform-action-" + crypto.randomUUID(),
      successMessageType: PlatformWebAuthnGetCredentialSuccessMessage,
      outgoingMessage: (target) =>
        new PlatformWebAuthnGetCredentialMessage(target, {
          optionsJSON: config.optionsJSON,
        }),
      parseSuccessPayload: (payload) =>
        webAuthnAuthenticationResponseSchema.parse(payload),
      onSuccess: (payload) =>
        config.onSuccess(
          payload.credentialJSON as unknown as AuthenticationResponseJSON,
        ),
      onError: config.onError,
    });
  }

  private runWebAuthnPlatformAction<TPayload>(config: {
    target: string;
    successMessageType:
      | typeof PlatformWebAuthnCreateCredentialSuccessMessage
      | typeof PlatformWebAuthnGetCredentialSuccessMessage;
    outgoingMessage: (
      target: string,
    ) =>
      | PlatformWebAuthnCreateCredentialMessage
      | PlatformWebAuthnGetCredentialMessage;
    parseSuccessPayload: (payload: unknown) => TPayload;
    onSuccess: (payload: TPayload) => void;
    onError?: (text: string) => void;
  }) {
    const errorPayloadSchema = z.strictObject({
      message: z.string(),
    });

    const subscription = this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) &&
            unsafeMessage.target === config.target,
        ),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          subscription.unsubscribe();
          if (unsafeMessage instanceof config.successMessageType) {
            const payload = config.parseSuccessPayload(unsafeMessage.payload);
            config.onSuccess(payload);
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const payload = errorPayloadSchema.parse(unsafeMessage.payload);
            if (typeof config.onError === "function") {
              config.onError(payload.message);
            }
          }
        }),
      );

    this.client.outcomingMessage$.next(config.outgoingMessage(config.target));
  }
}

const webAuthnJsonObjectSchema = z.record(z.string(), z.unknown());

const webAuthnRegistrationResponseSchema = z.strictObject({
  credentialJSON: webAuthnJsonObjectSchema,
});

const webAuthnAuthenticationResponseSchema = z.strictObject({
  credentialJSON: webAuthnJsonObjectSchema,
});
