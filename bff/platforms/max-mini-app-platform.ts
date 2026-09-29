import { MaxMiniAppRequestContactMessage } from "@matreshka/shared/messages/bff-to-client/platforms/max-mini-app/max-mini-app-request-contact-message";
import { MaxMiniAppRequestContactActionSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/max-mini-app/max-mini-app-request-contact-action-success-message";
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
  phone: z.string(),
});

type MaxWebAppUser = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
  photo_url: string;
};
// Source https://core.telegram.org/bots/webapps#webappinitdata
type MaxWebAppInitData = {
  query_id: string;
  auth_date: string;
  hash: string;
  start_param?: string;
  user: MaxWebAppUser;
  chat: {
    id: number;
    type: string;
  };
  chat_type?: string;
  chat_instance?: string;
};

/**
 * Платформа для Max Mini App.
 */
export class MaxMiniAppPlatform extends WebPlatform {
  /**
   * Запрашивает контактные данные пользователя в Max Mini App.
   *
   * @param config Объект с обработчиками успешного получения контакта и отмены.
   */
  requestContact(config: {
    onReceive: (
      data: z.infer<typeof requestContactSuccessMessageSchema>,
    ) => void;
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
            MaxMiniAppRequestContactActionSuccessMessage
          ) {
            const messagePayload = requestContactSuccessMessageSchema.parse(
              unsafeMessage.payload,
            );
            config.onReceive(messagePayload);
          }
        }),
      );

    this.client.outcomingMessage$.next(
      new MaxMiniAppRequestContactMessage(scope),
    );
  }

  initData(botToken: string): MaxWebAppInitData {
    const initDataString = this.client.state$.getValue().platform
      .payload as string;
    const verified = this.verifyMaxWebAppData(initDataString, botToken);
    if (verified) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const res: Omit<MaxWebAppInitData, "user" | "chat"> & {
        user?: string;
        chat?: string;
      } = Object.fromEntries(new URLSearchParams(initDataString)) as any;

      return {
        ...res,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user: res.user ? JSON.parse(res.user) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        chat: res.chat ? JSON.parse(res.chat) : undefined,
      };
    } else {
      throw new Error("Init data validation failed, check bot token");
    }
  }

  private verifyMaxWebAppData(maxInitData: string, botToken: string) {
    // The data is a query string, which is composed of a series of field-value pairs.
    const encoded = decodeURIComponent(maxInitData);

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
}
