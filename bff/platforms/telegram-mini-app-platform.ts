import { TelegramMiniAppDownloadFileMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-download-file-message";
import { TelegramMiniAppGetGeolocationMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-get-geolocation-message";
import { TelegramMiniAppRequestContactMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-request-contact-message";
import { TelegramMiniAppShareMessage } from "@matreshka/shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-share-message";
import { TelegramMiniAppGetGeolocationSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-get-geolocation-success-message";
import { TelegramMiniAppRequestContactActionCancelMessage } from "@matreshka/shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-request-contact-action-cancel-message";
import { TelegramMiniAppRequestContactActionSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-request-contact-action-success-message";
import crypto from "crypto";
import type { Observable } from "rxjs";
import { z } from "zod/v4";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";
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

const telegramGeolocationSuccessSchema = z.strictObject({
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number().nullable(),
  course: z.number().nullable(),
  speed: z.number().nullable(),
  horizontal_accuracy: z.number().nullable(),
  vertical_accuracy: z.number().nullable(),
  course_accuracy: z.number().nullable(),
  speed_accuracy: z.number().nullable(),
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
  downloadFile(url: string, filename: string): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new TelegramMiniAppDownloadFileMessage(scope, { url, filename }),
    });
  }

  share(data: {
    url?: string;
    title?: string;
    text?: string;
  }): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new TelegramMiniAppShareMessage(scope, data),
    });
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
    const encoded = decodeURIComponent(telegramInitData);

    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken);

    const arr = encoded.split("&");
    const hashIndex = arr.findIndex((str) => str.startsWith("hash="));
    const hash = arr.splice(hashIndex, 1)[0].split("=")[1];
    arr.sort((a, b) => a.localeCompare(b));
    const dataCheckString = arr.join("\n");

    const secretHex = secret.digest("hex");
    const _hash = crypto
      .createHmac("sha256", secretHex)
      .update(dataCheckString)
      .digest("hex");

    return _hash === hash;
  }

  getGeolocation(): Observable<
    z.infer<typeof telegramGeolocationSuccessSchema>
  > {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new TelegramMiniAppGetGeolocationMessage(scope),
      parseSuccess: (unsafeMessage) => {
        if (
          unsafeMessage instanceof TelegramMiniAppGetGeolocationSuccessMessage
        ) {
          return telegramGeolocationSuccessSchema.parse(unsafeMessage.payload);
        }
      },
    });
  }

  requestContact(): Observable<
    z.infer<typeof requestContactSuccessMessageSchema>
  > {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new TelegramMiniAppRequestContactMessage(scope),
      parseSuccess: (unsafeMessage) => {
        if (
          unsafeMessage instanceof
          TelegramMiniAppRequestContactActionSuccessMessage
        ) {
          return requestContactSuccessMessageSchema.parse(
            unsafeMessage.payload,
          );
        }
      },
      parseFailure: (unsafeMessage) => {
        if (
          unsafeMessage instanceof
          TelegramMiniAppRequestContactActionCancelMessage
        ) {
          return new Error("User cancelled contact request");
        }
      },
    });
  }
}
