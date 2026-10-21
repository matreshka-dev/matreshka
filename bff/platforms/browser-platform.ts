import { BrowserAddEventToCalendarMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-add-event-to-calendar-message";
import { BrowserDownloadCsvContentMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-download-csv-content-message";
import { BrowserDownloadFileMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-download-file-message";
import { BrowserGetGeolocationMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-get-geolocation-message";
import { BrowserOpenFileMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-open-file-message";
import { BrowserRequestPushNotificationsMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-request-push-notifications-message";
import { BrowserShareMessage } from "@matreshka/shared/messages/bff-to-client/platforms/browser/browser-share-message";
import { PlatformWebAuthnCreateCredentialMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-webauthn-create-credential-message";
import { PlatformWebAuthnGetCredentialMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-webauthn-get-credential-message";
import { BrowserGetGeolocationSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/browser/browser-get-geolocation-success-message";
import { BrowserRequestPushNotificationsActionGrantedMessage } from "@matreshka/shared/messages/client-to-bff/platforms/browser/browser-request-push-notifications-action-granted-message";
import { PlatformWebAuthnCreateCredentialSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-webauthn-create-credential-success-message";
import { PlatformWebAuthnGetCredentialSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-webauthn-get-credential-success-message";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import type { Observable } from "rxjs";
import { z } from "zod/v4";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";
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

/**
 * Платформа для браузерной версии клиента.
 *
 * Расширяет `WebPlatform`, добавляя методы для взаимодействия с API браузера.
 */
export class BrowserPlatform extends WebPlatform {
  /**
   * Запрашивает геолокацию пользователя в веб-клиенте.
   *
   */
  getGeolocation(): Observable<{ latitude: number; longitude: number }> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new BrowserGetGeolocationMessage(scope),
      parseSuccess: (unsafeMessage) => {
        if (unsafeMessage instanceof BrowserGetGeolocationSuccessMessage) {
          return z
            .strictObject({
              latitude: z.number(),
              longitude: z.number(),
            })
            .parse(unsafeMessage.payload);
        }
      },
    });
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
  }): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new BrowserAddEventToCalendarMessage(scope, data),
    });
  }

  /**
   * Сохраняет CSV-файл на устройстве пользователя.
   *
   * @param filename Имя файла (будет добавлено расширение `.csv`, если не указано).
   * @param content Двумерный массив строк, представляющий содержимое CSV.
   */
  downloadCsvContent(filename: string, content: string[][]): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new BrowserDownloadCsvContentMessage(scope, {
          filename: filename.endsWith(".csv") ? filename : filename + ".csv",
          content,
        }),
    });
  }

  /**
   * Инициирует загрузку файла по указанному URL.
   *
   * @param url Ссылка на файл.
   * @param filename Имя сохраняемого файла.
   */
  downloadFile(url: string, filename: string): Observable<void> {
    // https://developer.mozilla.org/ru/docs/Web/HTML/Element/a#Attributes
    // Принудительная загрузка файлов, которые браузер может открыть, а не скачать (изображения и pdf), будет только для того же домена, иначе будет срабатывать открытие, либо будет игнорировать приоритетный filename
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new BrowserDownloadFileMessage(scope, { url, filename }),
    });
  }

  /**
   * Открывает файл во встроенном просмотрщике браузера (PDF, изображения и т.д.).
   *
   * @param url Ссылка на файл (blob: или HTTP).
   */
  openFile(url: string): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new BrowserOpenFileMessage(scope, { url }),
    });
  }

  /**
   * Делится содержимым через системное диалоговое окно обмена.
   *
   * @param data Объект с текстом, ссылкой и/или заголовком.
   */
  share(data: {
    url?: string;
    title?: string;
    text?: string;
  }): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new BrowserShareMessage(scope, data),
    });
  }

  /**
   * Запрашивает разрешение на push-уведомления и обрабатывает результат.
   *
   * @param publicKey Публичный VAPID-ключ для подписки в браузере.
   */
  registerPushNotifications(publicKey: string): Observable<{
    endpoint: string;
    expirationTime?: EpochTimeStamp | null;
    keys: { auth: string; p256dh: string };
  }> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new BrowserRequestPushNotificationsMessage(scope, { publicKey }),
      parseSuccess: (unsafeMessage) => {
        if (
          unsafeMessage instanceof
          BrowserRequestPushNotificationsActionGrantedMessage
        ) {
          return pushSubscriptionGrantedMessageSchema.parse(
            unsafeMessage.payload,
          ).subscription;
        }
      },
    });
  }

  /**
   * Регистрация WebAuthn credential (passkey / security key) в браузерном клиенте.
   *
   * @remarks Только `BrowserPlatform` / `PwaPlatform`. Mobile — не поддерживается.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
   */
  createWebAuthnCredential(
    optionsJSON: PublicKeyCredentialCreationOptionsJSON,
  ): Observable<RegistrationResponseJSON> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new PlatformWebAuthnCreateCredentialMessage(scope, { optionsJSON }),
      parseSuccess: (unsafeMessage) => {
        if (
          unsafeMessage instanceof
          PlatformWebAuthnCreateCredentialSuccessMessage
        ) {
          const payload = webAuthnRegistrationResponseSchema.parse(
            unsafeMessage.payload,
          );
          return payload.credentialJSON as unknown as RegistrationResponseJSON;
        }
      },
    });
  }

  /**
   * Аутентификация через WebAuthn credential в браузерном клиенте.
   */
  getWebAuthnCredential(
    optionsJSON: PublicKeyCredentialRequestOptionsJSON,
  ): Observable<AuthenticationResponseJSON> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new PlatformWebAuthnGetCredentialMessage(scope, { optionsJSON }),
      parseSuccess: (unsafeMessage) => {
        if (
          unsafeMessage instanceof PlatformWebAuthnGetCredentialSuccessMessage
        ) {
          const payload = webAuthnAuthenticationResponseSchema.parse(
            unsafeMessage.payload,
          );
          return payload.credentialJSON as unknown as AuthenticationResponseJSON;
        }
      },
    });
  }
}

const webAuthnJsonObjectSchema = z.record(z.string(), z.unknown());

const webAuthnRegistrationResponseSchema = z.strictObject({
  credentialJSON: webAuthnJsonObjectSchema,
});

const webAuthnAuthenticationResponseSchema = z.strictObject({
  credentialJSON: webAuthnJsonObjectSchema,
});
