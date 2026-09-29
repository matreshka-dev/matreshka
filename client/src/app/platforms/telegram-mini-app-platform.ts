import { PlatformId } from '@shared/enums/platform-id';
import { DisablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/disable-privacy-mode-message';
import { EnablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/enable-privacy-mode-message';
import { TelegramMiniAppDownloadFileMessage } from '@shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-download-file-message';
import { TelegramMiniAppGetGeolocationMessage } from '@shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-get-geolocation-message';
import { TelegramMiniAppRequestContactMessage } from '@shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-request-contact-message';
import { TelegramMiniAppShareMessage } from '@shared/messages/bff-to-client/platforms/telegram-mini-app/telegram-mini-app-share-message';
import { ErrorMessage } from '@shared/messages/client-to-bff/error-message';
import { TelegramMiniAppGetGeolocationSuccessMessage } from '@shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-get-geolocation-success-message';
import { TelegramMiniAppRequestContactActionCancelMessage } from '@shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-request-contact-action-cancel-message';
import { TelegramMiniAppRequestContactActionSuccessMessage } from '@shared/messages/client-to-bff/platforms/telegram-mini-app/telegram-mini-app-request-contact-action-success-message';
import { fetchFromObject } from '@shared/utils/fetch-from-object';
import { timer } from 'rxjs';
import type { LocationData, WebApp } from 'telegram-web-app';
import { loadScript } from '../utils/load-script';
import { objectSetValue } from '../utils/object-set-value';
import { WebPlatform } from './web-platform';

let webApp: WebApp;

class TelegramMiniAppStorage {
  private _values: Record<string, string> = {};

  boot(): Promise<void> {
    if (webApp.isVersionAtLeast('9.0')) {
      return new Promise((resolve, reject) => {
        webApp.DeviceStorage.getItem(
          'storage',
          (error: any, serializedValues: string) => {
            this._values = serializedValues ? JSON.parse(serializedValues) : {};
            resolve();
          },
        );
      });
    } else {
      const serializedValues = localStorage.getItem('storage');
      this._values = serializedValues ? JSON.parse(serializedValues) : {};
      return Promise.resolve();
    }
  }

  private save() {
    if (webApp.isVersionAtLeast('9.0')) {
      webApp.DeviceStorage.setItem('storage', JSON.stringify(this._values));
    } else {
      localStorage.setItem('storage', JSON.stringify(this._values));
    }
  }

  setItem(key: string, value: string) {
    objectSetValue(this._values, key, value);
    this.save();
  }

  values(): Readonly<Record<string, string>> {
    return this._values;
  }

  getItem(key: string): string | null {
    return (fetchFromObject(this.values(), key) as unknown as string) || null;
  }
}

export class TelegramMiniAppPlatform extends WebPlatform {
  storage = new TelegramMiniAppStorage();
  id(): PlatformId {
    return PlatformId.WebTelegramMiniApp;
  }

  share(payload: {
    url?: string;
    title?: string;
    text?: string;
  }): Promise<void> {
    const textWithTitle = [payload.title, payload.text]
      .filter((x) => x)
      .join(`\n\n`);
    const encodedText = textWithTitle ? encodeURIComponent(textWithTitle) : '';
    const encodedUrl = payload.url ? encodeURIComponent(payload.url) : '';

    const telegramShareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    const link = this.document.createElement('a');
    link.setAttribute('href', telegramShareUrl);
    link.target = '_blank';
    this.document.body.appendChild(link); // Required for FF
    link.click();
    return Promise.resolve();
  }

  downloadFile(payload: { url: string; filename: string }) {
    if (webApp.isVersionAtLeast('8.0')) {
      webApp.downloadFile(
        { url: payload.url, file_name: payload.filename },
        (res: boolean) => {
          // Тут можно реагировать на ответ пользователя, начал ли он скачивание файла
        },
      );
    } else {
      webApp.showAlert('Please update your Telegram');
    }
  }

  language(): Promise<string> {
    return Promise.resolve(this.window.navigator.language);
  }

  payload(): Record<string, unknown> {
    // webApp.initData доступна только в момент первой загрузки страницы, при перезагрузке она не подставляется
    return this.storage.getItem('telegram_init_data')
      ? { init_data: this.storage.getItem('telegram_init_data') }
      : {};
  }

  override async boot(): Promise<this> {
    await super.boot();
    this.postman.incomingMessage$.subscribe((message) => {
      if (message instanceof TelegramMiniAppGetGeolocationMessage) {
        webApp.LocationManager.init(() => {
          if (!webApp.LocationManager.isLocationAvailable) {
            this.postman.outcomingMessage$.next(
              new ErrorMessage(message.target, {
                message: 'Location is not available',
              }),
            );
            return;
          }
          // getLocation не вызывает ошибку, поэтому нужно проверять ситуацию, когда доступ запрещен
          const botPermissionsSubscription = timer(0, 100).subscribe(() => {
            if (
              webApp.LocationManager.isAccessRequested &&
              !webApp.LocationManager.isAccessGranted
            ) {
              botPermissionsSubscription.unsubscribe();
              this.postman.outcomingMessage$.next(
                new ErrorMessage(message.target, {
                  message: 'Location access in bot denied',
                }),
              );
            }
          });
          webApp.LocationManager.getLocation((data: LocationData | null) => {
            botPermissionsSubscription.unsubscribe();
            if (data) {
              this.postman.outcomingMessage$.next(
                new TelegramMiniAppGetGeolocationSuccessMessage(
                  message.target,
                  data,
                ),
              );
            }
          });
        });
        return;
      }
      if (message instanceof TelegramMiniAppShareMessage) {
        this.share(message.payload);
        return;
      }
      if (message instanceof EnablePrivacyModeMessage) {
        this.enablePrivacyMode();
        return;
      }
      if (message instanceof DisablePrivacyModeMessage) {
        this.disablePrivacyMode();
        return;
      }
      if (message instanceof TelegramMiniAppDownloadFileMessage) {
        this.downloadFile(message.payload);
        return;
      }
      if (message instanceof TelegramMiniAppRequestContactMessage) {
        this.requestContact(message);
        return;
      }
    });
    await loadScript(
      this.document,
      'https://telegram.org/js/telegram-web-app.js?59',
    );
    webApp = (this.window as any).Telegram?.WebApp;
    await this.storage.boot();
    if (webApp.initData !== 'query_id') {
      this.storage.setItem('telegram_init_data', webApp.initData);
    }
    // Safe area не тестировалась, но в теории должно работать, возможно нужно убрать -content
    this.document.documentElement.style.setProperty(
      `--safe-area-inset-top`,
      `var(--tg-content-safe-area-inset-top)`,
    );
    this.document.documentElement.style.setProperty(
      `--safe-area-inset-right`,
      `var(--tg-content-safe-area-inset-right)`,
    );
    this.document.documentElement.style.setProperty(
      `--safe-area-inset-bottom`,
      `var(--tg-content-safe-area-inset-bottom)`,
    );
    this.document.documentElement.style.setProperty(
      `--safe-area-inset-left`,
      `var(--tg-content-safe-area-inset-left)`,
    );
    return this;
  }

  requestContact(message: TelegramMiniAppRequestContactMessage) {
    const webView = (this.window as any)['Telegram']['WebView'];
    const handler = (type: any, payload: any) => {
      if (type === 'custom_method_invoked') {
        try {
          const contact = new URLSearchParams(
            decodeURIComponent(payload.result),
          ).get('contact');
          if (contact) {
            const contactObject: {
              phone_number: string;
              first_name: string;
              last_name?: string;
              user_id: number;
            } = JSON.parse(contact);
            webView.offEvent('custom_method_invoked', handler); // Разово получаем данные метода и отписываемся
            this.postman.outcomingMessage$.next(
              new TelegramMiniAppRequestContactActionSuccessMessage(
                message.target,
                contactObject,
              ),
            );
          }
        } catch (e) {
          console.log(e);
        }
      }
    };
    // Неофициальный способ, но иначе придется подключать бота
    webView.onEvent('custom_method_invoked', handler);
    webApp.requestContact((sent: boolean) => {
      if (!sent) {
        // Пользователь не предоставил доступ, отписка от события
        webView.offEvent('custom_method_invoked', handler);
        this.postman.outcomingMessage$.next(
          new TelegramMiniAppRequestContactActionCancelMessage(message.target),
        );
      }
    });
  }

  override storageValues(): Record<string, string> {
    return this.storage.values();
  }

  override openExternalLink(url: string) {
    webApp.openLink(url);
  }
}
