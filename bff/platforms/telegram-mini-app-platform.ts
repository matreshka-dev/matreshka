import { TelegramMiniAppDownloadFileMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-download-file-message";
import { TelegramMiniAppGetGeolocationMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-get-geolocation-message";
import { TelegramMiniAppRequestContactMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-request-contact-message";
import { TelegramMiniAppShareMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-share-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { TelegramMiniAppGetGeolocationSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-get-geolocation-success-message";
import { TelegramMiniAppRequestContactActionCancelMessage } from "@matreshka/shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-request-contact-action-cancel-message";
import { TelegramMiniAppRequestContactActionSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-request-contact-action-success-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import crypto from "crypto";
import { filter } from "rxjs";
import { z } from "zod/v4";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
import { WebPlatform } from "./web-platform";

/**
 * Входящее сообщение с данными пользователя после успешного запроса контакта.
 */
const requestContactSuccessMessageSchema = z.strictObject({
  phone_number: z.string(),
  first_name: z.string(),
  last_name: z.string().optional(),
  user_id: z.number(),
});

type TelegramWebAppUser = {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: true;
  added_to_attachment_menu?: true;
  allows_write_to_pm?: true;
  photo_url?: string;
};
// Source https://core.telegram.org/bots/webapps#webappinitdata
type TelegramWebAppInitData = {
  query?: string;
  user?: TelegramWebAppUser;
  receiver?: TelegramWebAppUser;
  chat?: {
    id: number;
    type: string;
    title: string;
    username?: string;
    photo_url?: string;
  };
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  auth_date: string;
  hash: string;
  signature: string;
};

/**
 * Платформа для Telegram Mini App.
 */
export class TelegramMiniAppPlatform extends WebPlatform {
  /**
   * Инициирует загрузку файла по указанному URL.
   *
   * @param url Ссылка на файл.
   * @param filename Имя файла для сохранения.
   */
  downloadFile(url: string, filename: string) {
    this.client.outcomingMessage$.next(
      new TelegramMiniAppDownloadFileMessage({ url, filename }),
    );
  }

  /**
   * Делится содержимым через системное диалоговое окно обмена.
   *
   * @param data Объект с текстом, ссылкой и/или заголовком.
   */
  share(data: { url?: string; title?: string; text?: string }) {
    this.client.outcomingMessage$.next(new TelegramMiniAppShareMessage(data));
  }

  initData(botToken: string): TelegramWebAppInitData {
    const initDataString = this.client.state$.getValue().platform
      .payload as string;
    const verified = this.verifyTelegramWebAppData(initDataString, botToken);
    if (verified) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const res: Omit<TelegramWebAppInitData, "user" | "receiver" | "chat"> & {
        user?: string;
        receiver?: string;
        chat?: string;
      } = Object.fromEntries(new URLSearchParams(initDataString)) as any;

      // if (res.user) {
      //   res.user = JSON.parse(res.user);
      // }
      return {
        ...res,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user: res.user ? JSON.parse(res.user) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        receiver: res.receiver ? JSON.parse(res.receiver) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        chat: res.chat ? JSON.parse(res.chat) : undefined,
      };
    } else {
      throw new Error("Init data validation failed, check bot token");
    }
  }

  private verifyTelegramWebAppData(telegramInitData: string, botToken: string) {
    // The data is a query string, which is composed of a series of field-value pairs.
    const encoded = decodeURIComponent(telegramInitData);

    // HMAC-SHA-256 signature of the bot's token with the constant string WebAppData used as a key.
    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken);

    // Data-check-string is a chain of all received fields'.
    const arr = encoded.split("&");
    const hashIndex = arr.findIndex((str) => str.startsWith("hash="));
    const hash = arr.splice(hashIndex, 1)[0].split("=")[1];
    // sorted alphabetically
    arr.sort((a, b) => a.localeCompare(b));
    // in the format key=<value> with a line feed character ('\n', 0x0A) used as separator
    // e.g., 'auth_date=<auth_date>\nquery_id=<query_id>\nuser=<user>
    const dataCheckString = arr.join("\n");

    // The hexadecimal representation of the HMAC-SHA-256 signature of the data-check-string with the secret key
    const secretHex = secret.digest("hex");
    const _hash = crypto
      .createHmac("sha256", secretHex)
      .update(dataCheckString)
      .digest("hex");

    // if hash are equal the data may be used on your server.
    // Complex data types are represented as JSON-serialized objects.
    return _hash === hash;
  }
  /**
   * Запрашивает геолокацию пользователя в Telegram Mini App.
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
          if (
            unsafeMessage instanceof TelegramMiniAppGetGeolocationSuccessMessage
          ) {
            const messagePayload = z
              .strictObject({
                latitude: z.number(),
                longitude: z.number(),
                altitude: z.number().nullable(),
                course: z.number().nullable(),
                speed: z.number().nullable(),
                horizontal_accuracy: z.number().nullable(),
                vertical_accuracy: z.number().nullable(),
                course_accuracy: z.number().nullable(),
                speed_accuracy: z.number().nullable(),
              })
              .parse(unsafeMessage.payload);
            config.onSuccess(messagePayload);
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const messagePayload = z
              .strictObject({
                message: z.string(),
              })
              .parse(unsafeMessage.payload);
            if (typeof config.onError === "function") {
              config.onError(messagePayload.message);
            }
          }
        }),
      );
    this.client.outcomingMessage$.next(
      new TelegramMiniAppGetGeolocationMessage(scope),
    );
  }

  /**
   * Запрашивает контактные данные пользователя в Telegram Mini App.
   *
   * @param config Объект с обработчиками успешного получения контакта и отмены.
   */
  requestContact(config: {
    onReceive: (
      data: z.infer<typeof requestContactSuccessMessageSchema>,
    ) => void;
    onCancel?: () => void;
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
            TelegramMiniAppRequestContactActionSuccessMessage
          ) {
            const messagePayload = requestContactSuccessMessageSchema.parse(
              unsafeMessage.payload,
            );
            config.onReceive(messagePayload);
            return;
          }
          if (
            unsafeMessage instanceof
            TelegramMiniAppRequestContactActionCancelMessage
          ) {
            if ("onCancel" in config) {
              config.onCancel!();
            }
          }
        }),
      );
    this.client.outcomingMessage$.next(
      new TelegramMiniAppRequestContactMessage(scope),
    );
  }
}
