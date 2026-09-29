import { inject, PLATFORM_ID } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { PlatformId } from '@shared/enums/platform-id';
import {
  HandshakeMessage as BffHandshakeMessage,
  HandshakePayload,
} from '@shared/messages/bff-to-client/app/handshake-message';
import { BrowserAddEventToCalendarMessage } from '@shared/messages/bff-to-client/platforms/browser/browser-add-event-to-calendar-message';
import { BrowserDownloadCsvContentMessage } from '@shared/messages/bff-to-client/platforms/browser/browser-download-csv-content-message';
import { BrowserDownloadFileMessage } from '@shared/messages/bff-to-client/platforms/browser/browser-download-file-message';
import { BrowserGetGeolocationMessage } from '@shared/messages/bff-to-client/platforms/browser/browser-get-geolocation-message';
import { BrowserOpenFileMessage } from '@shared/messages/bff-to-client/platforms/browser/browser-open-file-message';
import { BrowserRequestPushNotificationsMessage } from '@shared/messages/bff-to-client/platforms/browser/browser-request-push-notifications-message';
import { BrowserShareMessage } from '@shared/messages/bff-to-client/platforms/browser/browser-share-message';
import { DisablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/disable-privacy-mode-message';
import { EnablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/enable-privacy-mode-message';
import { PlatformEnumerateDevicesMessage } from '@shared/messages/bff-to-client/platforms/platform-enumerate-devices-message';
import { PlatformWebAuthnCreateCredentialMessage } from '@shared/messages/bff-to-client/platforms/platform-webauthn-create-credential-message';
import { PlatformWebAuthnGetCredentialMessage } from '@shared/messages/bff-to-client/platforms/platform-webauthn-get-credential-message';
import { ErrorMessage } from '@shared/messages/client-to-bff/error-message';
import { BrowserGetGeolocationSuccessMessage } from '@shared/messages/client-to-bff/platforms/browser/browser-get-geolocation-success-message';
import { BrowserRequestPushNotificationsActionGrantedMessage } from '@shared/messages/client-to-bff/platforms/browser/browser-request-push-notifications-action-granted-message';
import {
  PlatformEnumeratedDevice,
  PlatformEnumerateDevicesSuccessMessage,
} from '@shared/messages/client-to-bff/platforms/platform-enumerate-devices-success-message';
import {
  concat,
  defer,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { UpdateService } from '../services/update.service';
import { NAVIGATOR } from '../tokens/navigator';
import { convertToCsv } from '../utils/convert-to-csv';
import { generateCalendarEvent } from '../utils/generate-calendar-event';
import { BrowserStorage } from './shared/browser-storage';
import {
  handlePlatformWebAuthnCreateCredentialMessage,
  handlePlatformWebAuthnGetCredentialMessage,
} from './utils/webauthn';
import { WebPlatform } from './web-platform';

export class BrowserPlatform extends WebPlatform {
  swPush = inject(SwPush);
  storage = new BrowserStorage();
  platformId = inject(PLATFORM_ID);
  navigator = inject(NAVIGATOR);
  updateService = inject(UpdateService); // Не удалять, проверка обновления для PWA
  id(): PlatformId {
    // https://stackoverflow.com/questions/41742390/javascript-to-check-if-pwa-or-mobile-web
    return this.isPWA() ? PlatformId.WebPwa : PlatformId.WebBrowser;
  }

  private isPWA(): boolean {
    return (
      this.window.matchMedia('(display-mode: standalone)').matches ||
      'standalone' in this.navigator
    );
  }

  share(payload: {
    url?: string;
    title?: string;
    text?: string;
  }): Promise<void> {
    return this.navigator.share(payload);
  }

  language(): Promise<string> {
    return Promise.resolve(this.window.navigator.language);
  }

  private init(settings: HandshakePayload['settings']): Promise<void> {
    this.initPWA(settings);
    (this.document.getElementById('app-name') as HTMLMetaElement).content =
      settings.appName; // Вообще на iOS работает и без этого, берет значение похоже из манифеста, но оставил на всякий случай
    (this.document.getElementById('svg-favicon') as HTMLLinkElement).href =
      settings.faviconUrl?.svg ?? '/favicon.svg';
    (this.document.getElementById('png-favicon') as HTMLLinkElement).href =
      settings.faviconUrl?.png ?? '/favicon.png';
    (this.document.getElementById('home-screen-icon') as HTMLLinkElement).href =
      settings.pwaIconUrl?.png ?? '/pwa.png';
    return Promise.resolve();
  }

  private saveFile(payload: {
    content: string;
    filename: string;
    mimetype: string;
  }) {
    const blob = new Blob([payload.content], {
      type: `${payload.mimetype};charset=utf-8`,
    });
    const link = this.document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', payload.filename);
    this.document.body.appendChild(link); // Required for FF
    link.click();
    this.document.body.removeChild(link);
  }

  addEventToCalendar(data: {
    start: string | EpochTimeStamp; // Date string
    end?: string | EpochTimeStamp; // Date string
    summary: string;
    location?: string;
    description?: string;
    timeZone?: string;
  }) {
    this.saveFile({
      content: generateCalendarEvent(data),
      filename: data.summary + '.ics',
      mimetype: 'text/calendar',
    });
  }

  saveCsvContent(payload: { filename: string; content: string[][] }) {
    this.saveFile({
      content: convertToCsv(payload.content),
      filename: payload.filename,
      mimetype: 'text/csv',
    });
  }

  private async downloadFile(payload: {
    url: string;
    filename: string;
  }): Promise<void> {
    const { url, filename } = payload;

    // blob: — same-origin для <a download>, атрибут срабатывает напрямую.
    if (url.startsWith('blob:')) {
      this.triggerFileDownload(url, filename);
      return;
    }

    // cross-origin (другой порт/домен): браузер игнорирует download на <a>,
    // поэтому сначала fetch → blob URL, затем скачивание.
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      try {
        this.triggerFileDownload(blobUrl, filename);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      this.openExternalLink(url);
    }
  }

  private triggerFileDownload(url: string, filename: string): void {
    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    this.document.body.appendChild(link); // Required for FF
    link.click();
    link.remove();
  }

  private openFile(payload: { url: string }): void {
    void this.openFileAsync(payload);
  }

  private async openFileAsync(payload: { url: string }): Promise<void> {
    const { url } = payload;

    if (url.startsWith('blob:')) {
      this.triggerFileOpen(url);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      this.triggerFileOpen(blobUrl);
      this.window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      this.triggerFileOpen(url);
    }
  }

  private triggerFileOpen(url: string): void {
    const link = this.document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    this.document.body.appendChild(link);
    link.click();
    link.remove();
  }

  payload(): Record<string, unknown> {
    return {};
  }

  override async boot(): Promise<this> {
    await super.boot();
    this.postman.incomingMessage$.subscribe((message) => {
      if (message instanceof BffHandshakeMessage) {
        this.init(message.payload.settings);
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
      if (message instanceof BrowserGetGeolocationMessage) {
        navigator.geolocation.getCurrentPosition(
          (success) => {
            this.postman.outcomingMessage$.next(
              new BrowserGetGeolocationSuccessMessage(message.target, {
                latitude: success.coords.latitude,
                longitude: success.coords.longitude,
              }),
            );
          },
          (error) => {
            this.postman.outcomingMessage$.next(
              new ErrorMessage(message.target, {
                message: error.message,
              }),
            );
          },
        );
        return;
      }
      if (message instanceof BrowserAddEventToCalendarMessage) {
        this.addEventToCalendar(message.payload);
        return;
      }
      if (message instanceof BrowserDownloadCsvContentMessage) {
        this.saveCsvContent(message.payload);
        return;
      }
      if (message instanceof BrowserShareMessage) {
        this.share(message.payload);
        return;
      }
      if (message instanceof BrowserDownloadFileMessage) {
        this.downloadFile(message.payload);
        return;
      }
      if (message instanceof BrowserOpenFileMessage) {
        this.openFile(message.payload);
        return;
      }
      if (message instanceof BrowserRequestPushNotificationsMessage) {
        this.requestPushNotifications(message);
        return;
      }
      if (message instanceof PlatformEnumerateDevicesMessage) {
        this.enumerateMediaDevices(message.target);
        return;
      }
      if (message instanceof PlatformWebAuthnCreateCredentialMessage) {
        handlePlatformWebAuthnCreateCredentialMessage(this.postman, message);
        return;
      }
      if (message instanceof PlatformWebAuthnGetCredentialMessage) {
        handlePlatformWebAuthnGetCredentialMessage(this.postman, message);
        return;
      }
    });
    this.storage.boot();
    this.updateService.checkForUpdate();
    return this;
  }

  private async enumerateMediaDevices(scope: string): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const normalized: PlatformEnumeratedDevice[] = devices.map((d) => {
        const base: PlatformEnumeratedDevice = {
          kind: d.kind,
          deviceId: d.deviceId,
          groupId: d.groupId,
          label: d.label || undefined,
        };

        // InputDeviceInfo может иметь getCapabilities/getSettings, но это не гарантировано
        const anyDev = d as any;
        try {
          if (typeof anyDev.getCapabilities === 'function') {
            base.capabilities = anyDev.getCapabilities();
          }
        } catch {
          // ignore
        }
        try {
          if (typeof anyDev.getSettings === 'function') {
            base.settings = anyDev.getSettings();
          }
        } catch {
          // ignore
        }
        return base;
      });

      this.postman.outcomingMessage$.next(
        new PlatformEnumerateDevicesSuccessMessage(scope, {
          devices: normalized,
        }),
      );
    } catch (e: any) {
      this.postman.outcomingMessage$.next(
        new ErrorMessage(scope, {
          message: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  }

  private initPWA(settings: any) {
    const myDynamicManifest = {
      name: settings.appName,
      short_name: settings.appShortName,
      // "background_color": "#fafafa",
      display: 'fullscreen',
      id: '/',
      start_url: location.origin,
      icons: [
        {
          // https://stackoverflow.com/questions/64427667/how-to-use-svg-as-pwa-icon
          src: settings.pwaIconUrl?.svg ?? location.origin + '/pwa.svg',
          sizes: '48x48 72x72 96x96 128x128 256x256',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          // Возможно нужны еще другие размеры, нет возможности полноценно протестировать
          src: settings.pwaIconUrl?.png ?? location.origin + '/pwa.png',
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    };
    const stringManifest = JSON.stringify(myDynamicManifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);

    const link: HTMLLinkElement = this.document.createElement('link');
    link.setAttribute('href', manifestURL);
    link.rel = 'manifest';
    this.document.head.appendChild(link);
  }

  override storageValues(): Record<string, string> {
    return this.storage.values();
  }

  override openExternalLink(url: string) {
    this.window.location.href = url;
  }

  requestPushNotifications(message: BrowserRequestPushNotificationsMessage) {
    // FIXME https://github.com/angular/angular/issues/48702
    this.fixSwPush();
    // if(this.swPush.isEnabled) {
    try {
      this.swPush
        .requestSubscription({ serverPublicKey: message.payload.publicKey })
        .then((subscription) => {
          this.postman.outcomingMessage$.next(
            new BrowserRequestPushNotificationsActionGrantedMessage(
              message.target,
              { subscription },
            ),
          );
        })
        .catch((e) => {
          this.postman.outcomingMessage$.next(
            new ErrorMessage(message.target, {
              message: e.toString(),
            }),
          );
        });
    } catch (e) {
      // this.postman.outcomingMessage$.next({type: 'error', scope: message.target, payload: {text: e}});
    }
    // } else {
    //   this.postman.outcomingMessage$.next({type: 'error', scope: message.target, payload: {text: 'Push not enabled'}});
    // }
  }

  private fixSwPush(): void {
    // FIXME https://github.com/angular/angular/issues/48702
    if (!this.swPush.isEnabled) {
      return;
    }

    const serviceWorker: ServiceWorkerContainer | undefined =
      this.swPush?.['sw']?.['serviceWorker'];

    if (!serviceWorker) {
      return;
    }

    // Adapted from original code:
    // https://github.com/angular/angular/blob/c3b00959659ca20d3f798820dfcb4dee250a32ac/packages/service-worker/src/low_level.ts#L137
    const controllerChangeEvents = fromEvent(serviceWorker, 'controllerchange');
    const controllerChanges = controllerChangeEvents.pipe(
      map(() => serviceWorker.controller),
    );
    const currentController = defer(() => of(serviceWorker.controller));

    const registration = concat(
      // The actual fix, here we don't do the falsy filtering for the currentController (as it is null on a hard refresh)
      currentController,
      controllerChanges.pipe(filter((c): c is ServiceWorker => !!c)),
    ).pipe(
      // Instead just try to get the ServiceWorkerRegistration here
      switchMap(() => serviceWorker.getRegistration()),
      // And filter out any falsy ServiceWorkerRegistration at the end
      filter((swr): swr is ServiceWorkerRegistration => !!swr),
    );

    // Adapted from original code:
    // https://github.com/angular/angular/blob/c3b00959659ca20d3f798820dfcb4dee250a32ac/packages/service-worker/src/push.ts#L151
    const pushManager = registration.pipe(
      map((registration) => registration.pushManager),
    );

    // Overwrite the original pushManager
    this.swPush['pushManager'] = pushManager;

    const workerDrivenSubscriptions = pushManager.pipe(
      switchMap((pm) => pm.getSubscription()),
    );

    // Overwrite the original subscription.
    // Typed as readonly, but is a writable instance field at runtime.
    (
      this.swPush as { subscription: Observable<PushSubscription | null> }
    ).subscription = merge(
      workerDrivenSubscriptions,
      this.swPush['subscriptionChanges'] as Subject<PushSubscription | null>,
    );
  }
}
