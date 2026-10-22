import { MobileAddEventToCalendarMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-add-event-to-calendar-message";
import { MobileConnectToBleDeviceMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-connect-to-ble-device-message";
import { MobileDisconnectMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-disconnect-message";
import { MobileDiscoverBleServicesMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-discover-ble-services-message";
import { MobileDownloadCsvContentMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-download-csv-content-message";
import { MobileDownloadFileMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-download-file-message";
import { MobileGetBleServicesMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-get-ble-services-message";
import { MobileGetGeolocationMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-get-geolocation-message";
import { MobileReadBleCharacteristicMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-read-ble-characteristic-message";
import { MobileRequestBleScanMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-request-ble-scan-message";
import { MobileRequestPushNotificationsMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-request-push-notifications-message";
import { MobileShareMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-share-message";
import { MobileStopMessage } from "@matreshka/shared/messages/bff-to-client/platforms/mobile/mobile-stop-message";
import { MobileBleDisconnectMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-disconnect-message";
import { MobileBleReceiveMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-receive-message";
import { MobileBleServicesMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-services-message";
import { MobileBleValueMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-value-message";
import { MobileGetGeolocationSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-get-geolocation-success-message";
import { MobileRequestPushNotificationsActionGrantedMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-request-push-notifications-action-granted-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import type { MobileBleService } from "@matreshka/shared/types/mobile-ble-services";
import {
  filter,
  map,
  Observable,
  Subject,
  Subscription,
  take,
  takeUntil,
  tap,
} from "rxjs";
import { z } from "zod/v4";
import { Client } from "../core";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
import { ClientPlatform } from "./client-platform";
import { mobileBleServicesSchema } from "./utils/mobile-ble-services";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";
import { targetedClientPlatformStream } from "./utils/targeted-client-platform-stream";

/**
 * Входящее сообщение, содержащее успешно полученный push-токен.
 */
const pushTokenGrantedMessageSchema = z.strictObject({
  token: z.strictObject({
    value: z.string(),
  }),
});

/**
 * Входящее сообщение с найденным устройством BLE
 */
export const bleScanResultSchema = z.object({
  // Не strictObject, потому что на андройде еще прилетает rawAdvertisement
  // https://github.com/capacitor-community/bluetooth-le?tab=readme-ov-file#scanresult
  device: z.strictObject({
    name: z.string().optional(),
    deviceId: z.string(),
  }),
  localName: z.string().optional(),
  txPower: z.number(),
  rssi: z.number(),
  manufacturerData: z.record(z.string(), z.unknown()).optional(),
  serviceData: z.record(z.string(), z.unknown()).optional(),
  uuids: z.array(z.string()),
});

export type BleScanResult = z.infer<typeof bleScanResultSchema>;

/**
 * Абстрактная платформа, реализующая функции взаимодействия с нативной мобильной средой.
 */
export abstract class MobilePlatform extends ClientPlatform {
  /**
   * Добавляет событие в системный календарь устройства.
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
        new MobileAddEventToCalendarMessage(scope, data),
    });
  }

  /**
   * Инициирует загрузку CSV-файла с заданным именем и содержимым.
   */
  downloadCsvContent(filename: string, content: string[][]): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileDownloadCsvContentMessage(scope, {
          filename: filename.endsWith(".csv") ? filename : filename + ".csv",
          content,
        }),
    });
  }

  /**
   * Инициирует загрузку файла по заданной ссылке.
   */
  downloadFile(url: string, filename: string): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileDownloadFileMessage(scope, { url, filename }),
    });
  }

  /**
   * Делится содержимым через системное диалоговое окно обмена.
   */
  share(data: {
    url?: string;
    title?: string;
    text?: string;
  }): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new MobileShareMessage(scope, data),
    });
  }

  /** Запрашивает геолокацию пользователя. */
  getGeolocation(): Observable<{ latitude: number; longitude: number }> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new MobileGetGeolocationMessage(scope),
      parseSuccess: (unsafeMessage) => {
        if (unsafeMessage instanceof MobileGetGeolocationSuccessMessage) {
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

  /** Запрашивает разрешение на push-уведомления и возвращает токен. */
  registerPushNotifications(): Observable<{ value: string }> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileRequestPushNotificationsMessage(scope),
      parseSuccess: (unsafeMessage) => {
        if (
          unsafeMessage instanceof
          MobileRequestPushNotificationsActionGrantedMessage
        ) {
          const messagePayload = pushTokenGrantedMessageSchema.parse(
            unsafeMessage.payload,
          );
          return messagePayload.token;
        }
      },
    });
  }

  /**
   * Запрашивает сканирование BLE-устройств.
   *
   * Hot: скан стартует при вызове метода. Отписка всех observers отправляет stop на клиент.
   */
  requestBLEScan(config: {
    services?: (number | string)[];
    name?: string;
    namePrefix?: string;
  }): Observable<BleScanResult> {
    return targetedClientPlatformStream(this.client, {
      outgoingMessage: (scope) =>
        new MobileRequestBleScanMessage(scope, {
          services: config.services,
          name: config.name,
          namePrefix: config.namePrefix,
        }),
      parseItem: (unsafeMessage) => {
        if (unsafeMessage instanceof MobileBleReceiveMessage) {
          return bleScanResultSchema.parse(unsafeMessage.payload);
        }
      },
      onTeardown: (scope, client) => {
        client.outcomingMessage$.next(new MobileStopMessage(scope));
      },
    });
  }

  connectToBLEDevice(deviceId: string): Observable<BLEDevice> {
    const device = new BLEDevice(deviceId, this.client);
    return device.connect().pipe(map(() => device));
  }
}

class BLEDevice {
  private sessionScope = "ble-device-" + crypto.randomUUID();
  disconnect$ = new Subject<void>();
  private sessionEnded = false;
  private sessionDisconnectListenerStarted = false;
  private sessionIncomingSubscription?: Subscription;
  private clientDestroySubscription?: Subscription;

  constructor(
    private id: string,
    private client: Client,
  ) {}

  connect(): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileConnectToBleDeviceMessage(scope, {
          deviceId: this.id,
          disconnectNotifyTarget: this.sessionScope,
        }),
    }).pipe(tap(() => this.startSessionDisconnectListener()));
  }

  private startSessionDisconnectListener(): void {
    if (this.sessionDisconnectListenerStarted || this.sessionEnded) {
      return;
    }
    this.sessionDisconnectListenerStarted = true;
    this.sessionIncomingSubscription = this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) &&
            unsafeMessage.target === this.sessionScope,
        ),
        takeUntil(this.disconnect$),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          if (unsafeMessage instanceof MobileBleDisconnectMessage) {
            this.endSession();
          }
        }),
      );
    this.clientDestroySubscription = this.client.destroy$
      .pipe(take(1))
      .subscribe(() => this.endSession());
  }

  private endSession(): void {
    if (this.sessionEnded) {
      return;
    }
    this.sessionEnded = true;
    this.sessionIncomingSubscription?.unsubscribe();
    this.clientDestroySubscription?.unsubscribe();
    this.disconnect$.next();
    this.disconnect$.complete();
  }

  disconnect(): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileDisconnectMessage(scope, { deviceId: this.id }),
    }).pipe(tap(() => this.endSession()));
  }

  read(
    serviceId: number | string,
    characteristicId: number | string,
  ): Observable<number> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileReadBleCharacteristicMessage(scope, {
          deviceId: this.id,
          serviceId,
          characteristicId,
        }),
      parseSuccess: (unsafeMessage) => {
        if (unsafeMessage instanceof MobileBleValueMessage) {
          const payload = z
            .strictObject({
              value: z.number(),
            })
            .parse(unsafeMessage.payload);
          return payload.value;
        }
      },
    });
  }

  getServices(): Observable<MobileBleService[]> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileGetBleServicesMessage(scope, { deviceId: this.id }),
      parseSuccess: (unsafeMessage) => {
        if (unsafeMessage instanceof MobileBleServicesMessage) {
          const payload = z
            .strictObject({ services: mobileBleServicesSchema })
            .parse(unsafeMessage.payload);
          return payload.services;
        }
      },
    });
  }

  discoverServices(): Observable<MobileBleService[]> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new MobileDiscoverBleServicesMessage(scope, { deviceId: this.id }),
      parseSuccess: (unsafeMessage) => {
        if (unsafeMessage instanceof MobileBleServicesMessage) {
          const payload = z
            .strictObject({ services: mobileBleServicesSchema })
            .parse(unsafeMessage.payload);
          return payload.services;
        }
      },
    });
  }
}
