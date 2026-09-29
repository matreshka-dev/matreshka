import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';
import {
  FileOpener,
  FileOpenerOptions,
} from '@capacitor-community/file-opener';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { PrivacyScreen } from '@capacitor/privacy-screen';
import {
  PushNotifications,
  RegistrationError,
  Token,
} from '@capacitor/push-notifications';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { DisablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/disable-privacy-mode-message';
import { EnablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/enable-privacy-mode-message';
import { MobileAddEventToCalendarMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-add-event-to-calendar-message';
import { MobileConnectToBleDeviceMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-connect-to-ble-device-message';
import { MobileDisconnectMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-disconnect-message';
import { MobileDiscoverBleServicesMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-discover-ble-services-message';
import { MobileDownloadCsvContentMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-download-csv-content-message';
import { MobileDownloadFileMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-download-file-message';
import { MobileGetBleServicesMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-get-ble-services-message';
import { MobileGetGeolocationMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-get-geolocation-message';
import { MobileReadBleCharacteristicMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-read-ble-characteristic-message';
import { MobileRequestBleScanMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-request-ble-scan-message';
import { MobileRequestPushNotificationsMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-request-push-notifications-message';
import { MobileShareMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-share-message';
import { MobileStopMessage } from '@shared/messages/bff-to-client/platforms/mobile/mobile-stop-message';
import { ErrorMessage } from '@shared/messages/client-to-bff/error-message';
import { MobileBleConnectMessage } from '@shared/messages/client-to-bff/platforms/mobile/mobile-ble-connect-message';
import { MobileBleDisconnectMessage } from '@shared/messages/client-to-bff/platforms/mobile/mobile-ble-disconnect-message';
import { MobileBleReceiveMessage } from '@shared/messages/client-to-bff/platforms/mobile/mobile-ble-receive-message';
import { MobileBleServicesMessage } from '@shared/messages/client-to-bff/platforms/mobile/mobile-ble-services-message';
import { MobileBleValueMessage } from '@shared/messages/client-to-bff/platforms/mobile/mobile-ble-value-message';
import { MobileGetGeolocationSuccessMessage } from '@shared/messages/client-to-bff/platforms/mobile/mobile-get-geolocation-success-message';
import { MobileRequestPushNotificationsActionGrantedMessage } from '@shared/messages/client-to-bff/platforms/mobile/mobile-request-push-notifications-action-granted-message';
import { isTargetedMessage } from '@shared/messages/targeted-message';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { filter, Subject, take } from 'rxjs';
import { CalendarEventPayload } from '../types/calendar-event-payload';
import { convertToCsv } from '../utils/convert-to-csv';
import { generateCalendarEvent } from '../utils/generate-calendar-event';
import { objectSetValue } from '../utils/object-set-value';
import { ClientPlatform } from './client-platform';

class MobileStorage {
  private _values: Record<string, string> = {};

  constructor() {}

  boot(): Promise<void> {
    return new Promise((resolve) => {
      Preferences.get({
        key: 'storage',
      }).then((result) => {
        this._values = result.value ? JSON.parse(result.value) : {};
        resolve();
      });
    });
  }

  private save() {
    Preferences.set({
      key: 'storage',
      value: JSON.stringify(this._values),
    });
  }

  setItem(key: string, value: string) {
    objectSetValue(this._values, key, value);
    this.save();
  }

  values(): Readonly<Record<string, string>> {
    return this._values;
  }
}

export abstract class MobilePlatform extends ClientPlatform {
  override async applicationId(): Promise<string> {
    const info = await App.getInfo();
    return info.id;
  }

  bleClientInitialed = false;
  storage = new MobileStorage();
  pushToken = new Subject<Token>();
  pushError = new Subject<RegistrationError>();
  share(payload: { url?: string; title?: string; text?: string }) {
    return Share.share(payload).then(() => {
      return;
    });
  }

  async initBleClient() {
    if (!this.bleClientInitialed) {
      this.bleClientInitialed = true;
      return BleClient.initialize();
    }
    return Promise.resolve();
  }

  private async readBleCharacteristic(
    message: MobileReadBleCharacteristicMessage,
  ) {
    try {
      await this.initBleClient();
      const dataView = await BleClient.read(
        message.payload.deviceId,
        typeof message.payload.serviceId === 'number'
          ? numberToUUID(message.payload.serviceId)
          : message.payload.serviceId,
        typeof message.payload.characteristicId === 'number'
          ? numberToUUID(message.payload.characteristicId)
          : message.payload.characteristicId,
      );
      if (!dataView || dataView.byteLength < 1) {
        throw new Error(
          `BLE read returned empty value (serviceId=${message.payload.serviceId}, characteristicId=${message.payload.characteristicId})`,
        );
      }
      const value = dataView.getUint8(0);
      this.postman.outcomingMessage$.next(
        new MobileBleValueMessage(message.target, { value }),
      );
    } catch (error: any) {
      this.postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: error.toString(),
        }),
      );
    }
  }

  private async getBleServices(message: MobileGetBleServicesMessage) {
    try {
      await this.initBleClient();
      const services = await BleClient.getServices(message.payload.deviceId);
      this.postman.outcomingMessage$.next(
        new MobileBleServicesMessage(message.target, { services }),
      );
    } catch (error: any) {
      this.postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: error.toString(),
        }),
      );
    }
  }

  private async discoverBleServices(message: MobileDiscoverBleServicesMessage) {
    try {
      await this.initBleClient();
      await BleClient.discoverServices(message.payload.deviceId);
      const services = await BleClient.getServices(message.payload.deviceId);
      this.postman.outcomingMessage$.next(
        new MobileBleServicesMessage(message.target, { services }),
      );
    } catch (error: any) {
      this.postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: error.toString(),
        }),
      );
    }
  }

  private async connectToBleDevice(message: MobileConnectToBleDeviceMessage) {
    try {
      await this.initBleClient();
      await BleClient.connect(message.payload.deviceId, () => {
        this.postman.outcomingMessage$.next(
          new MobileBleDisconnectMessage(message.target),
        );
      });
      this.postman.incomingMessage$
        .pipe(
          filter((m) => isTargetedMessage(m) && m.target === message.target),
        )
        .subscribe(async (m) => {
          if (m instanceof MobileDisconnectMessage) {
            await BleClient.disconnect(message.payload.deviceId);
          }
        });
      this.postman.outcomingMessage$.next(
        new MobileBleConnectMessage(message.target),
      );
    } catch (error: any) {
      this.postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: error.toString(),
        }),
      );
    }
  }

  private async requestBleScan(message: MobileRequestBleScanMessage) {
    try {
      await this.initBleClient();
      this.postman.incomingMessage$
        .pipe(
          filter((m) => isTargetedMessage(m) && m.target === message.target),
          take(1),
        )
        .subscribe((incoming) => {
          if (incoming instanceof MobileStopMessage) {
            BleClient.stopLEScan();
          }
        });
      await BleClient.requestLEScan(
        {
          services: message.payload.services
            ? message.payload.services.map((serviceId) =>
                typeof serviceId === 'number'
                  ? numberToUUID(serviceId)
                  : serviceId,
              )
            : [],
          optionalServices: [numberToUUID(0x180f)],
          name: message.payload.name,
          namePrefix: message.payload.namePrefix,
        },
        (result) => {
          this.postman.outcomingMessage$.next(
            new MobileBleReceiveMessage(message.target, result),
          );
        },
      );
    } catch (error: any) {
      this.postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: error.message,
        }),
      );
    }
  }

  protected setStatusBarStyle() {
    const forced = document.documentElement.getAttribute('data-color-scheme');
    const isDark =
      forced === 'dark'
        ? true
        : forced === 'light'
          ? false
          : !!(
              window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: dark)').matches
            );
    StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
  }

  protected override onColorSchemePreferenceApplied(): void {
    this.setStatusBarStyle();
  }

  override async boot(): Promise<this> {
    await super.boot();
    this.postman.incomingMessage$.subscribe((message) => {
      if (message instanceof MobileAddEventToCalendarMessage) {
        this.addEventToCalendar(message.payload);
        return;
      }
      if (message instanceof MobileDownloadCsvContentMessage) {
        this.saveCsvContent(message.payload);
        return;
      }
      if (message instanceof MobileDownloadFileMessage) {
        this.downloadFile(message.payload);
        return;
      }
      if (message instanceof MobileShareMessage) {
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
      if (message instanceof MobileGetGeolocationMessage) {
        const sendGeolocation = () => {
          Geolocation.checkPermissions().then((res) => {
            switch (res.location) {
              case 'denied':
                this.postman.outcomingMessage$.next(
                  new ErrorMessage(message.target, {
                    message: 'User denied permissions!',
                  }),
                );
                break;
              case 'granted':
                Geolocation.getCurrentPosition()
                  .then((res) => {
                    this.postman.outcomingMessage$.next(
                      new MobileGetGeolocationSuccessMessage(message.target, {
                        latitude: res.coords.latitude,
                        longitude: res.coords.longitude,
                      }),
                    );
                  })
                  .catch((err) => {
                    this.postman.outcomingMessage$.next(
                      new ErrorMessage(message.target, {
                        message: err.message,
                      }),
                    );
                  });
                break;
              case 'prompt':
              case 'prompt-with-rationale':
                Geolocation.requestPermissions()
                  .then(() => {
                    sendGeolocation();
                  })
                  .catch((err) => {
                    this.postman.outcomingMessage$.next(
                      new ErrorMessage(message.target, {
                        message: err.message,
                      }),
                    );
                  });
                break;
            }
          });
        };
        sendGeolocation();
        return;
      }
      if (message instanceof MobileRequestBleScanMessage) {
        this.requestBleScan(message);
        return;
      }
      if (message instanceof MobileRequestPushNotificationsMessage) {
        this.requestPushNotifications(message);
        return;
      }
      if (message instanceof MobileConnectToBleDeviceMessage) {
        this.connectToBleDevice(message);
        return;
      }
      if (message instanceof MobileReadBleCharacteristicMessage) {
        this.readBleCharacteristic(message);
        return;
      }
      if (message instanceof MobileGetBleServicesMessage) {
        this.getBleServices(message);
        return;
      }
      if (message instanceof MobileDiscoverBleServicesMessage) {
        this.discoverBleServices(message);
        return;
      }
    });
    await this.storage.boot();
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      // TODO Тут был this.zone.run(() => ....), но я его удалил после обновления до Angular 20, нужно проверить работу дип линков
      const slug = new URL(event.url).pathname;
      if (slug) {
        this.router.navigateByUrl(slug);
      }
    });
    const setInsets = (insets: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    }) => {
      for (const [key, value] of Object.entries(insets)) {
        this.document.documentElement.style.setProperty(
          `--safe-area-inset-${key}`,
          `${value}px`,
        );
      }
    };
    this.setStatusBarStyle();
    this.window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        this.setStatusBarStyle();
      });
    // Отслеживание SafeArea
    const data = await SafeArea.getSafeAreaInsets();
    setInsets(data.insets);
    await SafeArea.addListener('safeAreaChanged', (data) => {
      setInsets(data.insets);
    });
    // Подписка на события push уведомлений
    await PushNotifications.addListener('registration', (token) => {
      this.pushToken.next(token);
    });

    await PushNotifications.addListener('registrationError', (err) => {
      this.pushError.next(err);
    });

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push notification received: ', notification);
      },
    );

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log(
          'Push notification action performed',
          notification.actionId,
          notification.inputValue,
        );
      },
    );

    return this;
  }

  language() {
    return Device.getLanguageTag().then((res) => res.value);
  }

  payload() {
    return {};
  }

  addEventToCalendar(payload: CalendarEventPayload) {
    Filesystem.writeFile({
      path: payload.summary + '.ics',
      data: generateCalendarEvent(payload),
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    }).then((res) => {
      const fileOpenerOptions: FileOpenerOptions = {
        filePath: res.uri,
        contentType: 'text/calendar',
        openWithDefault: true, // Тут true, потому что календарь есть всегда
      };
      FileOpener.open(fileOpenerOptions);
    });
  }

  saveCsvContent(payload: { filename: string; content: string[][] }) {
    Filesystem.writeFile({
      path: payload.filename,
      data: convertToCsv(payload.content),
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    }).then((res) => {
      const fileOpenerOptions: FileOpenerOptions = {
        filePath: res.uri,
        contentType: 'text/csv',
        openWithDefault: false, // Если оставить true, то на андроиде в случае отсутствия нужного приложения ничего не произойдет и пользователь не поймет в чем ошибка
      };
      FileOpener.open(fileOpenerOptions);
    });
  }

  downloadFile(payload: { url: string; filename: string }) {
    Filesystem.downloadFile({
      url: payload.url,
      path: payload.filename,
      directory: Directory.Cache, // Если не в кэш, то нужно придумывать логику сохранения, чтобы файлы с одинаковыми именами не затирали друг друга
    }).then((res) => {
      const fileOpenerOptions: FileOpenerOptions = {
        filePath: res.path!,
        openWithDefault: false, // Если оставить true, то на андроиде в случае отсутствия нужного приложения ничего не произойдет и пользователь не поймет в чем ошибка
      };
      FileOpener.open(fileOpenerOptions);
    });
  }

  enablePrivacyMode() {
    PrivacyScreen.enable({
      ios: {
        blurEffect: 'light',
      },
      android: {
        dimBackground: true,
      },
    });
  }

  disablePrivacyMode() {
    PrivacyScreen.disable();
  }

  override storageValues(): Record<string, string> {
    return this.storage.values();
  }

  override openExternalLink(url: string) {
    // Думал, что потребуется использовать https://capacitorjs.com/docs/apis/inappbrowser, но работает и стандартный способ
    this.window.location.href = url;
  }

  async requestPushNotifications(
    message: MobileRequestPushNotificationsMessage,
  ) {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      this.postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: 'User denied permissions!',
        }),
      );
      throw new Error('User denied permissions!');
    }

    const tokenSubscription = this.pushToken.subscribe((token) => {
      tokenSubscription.unsubscribe();
      errorSubscription.unsubscribe();
      this.postman.outcomingMessage$.next(
        new MobileRequestPushNotificationsActionGrantedMessage(message.target, {
          token,
        }),
      );
    });

    const errorSubscription = this.pushError.subscribe((err) => {
      tokenSubscription.unsubscribe();
      errorSubscription.unsubscribe();
      this.postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: err.toString(),
        }),
      );
    });
    PushNotifications.register();
  }
}
