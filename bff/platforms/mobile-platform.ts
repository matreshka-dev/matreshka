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
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { MobileBleConnectMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-connect-message";
import { MobileBleDisconnectMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-disconnect-message";
import { MobileBleReceiveMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-receive-message";
import { MobileBleServicesMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-services-message";
import { MobileBleValueMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-ble-value-message";
import { MobileGetGeolocationSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-get-geolocation-success-message";
import { MobileRequestPushNotificationsActionGrantedMessage } from "@matreshka/shared/messages/client-to-bff/platforms/mobile/mobile-request-push-notifications-action-granted-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import type { MobileBleService } from "@matreshka/shared/types/mobile-ble-services";
import { filter, Subject, takeUntil } from "rxjs";
import { z } from "zod/v4";
import { Client } from "../core";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
import { ClientPlatform } from "./client-platform";
import { mobileBleServicesSchema } from "./utils/mobile-ble-services";

/**
 * Входящее сообщение, содержащее успешно полученный push-токен.
 */
const pushTokenGrantedMessageSchema = z.strictObject({
  token: z.strictObject({
    value: z.string(),
  }),
});

/**
 * Входящее сообщение об ошибке при получении push-токена.
 */
const errorMessagePayloadSchema = z.strictObject({
  message: z.string(),
});

/**
 * Входящее сообщение с найденным устройством BLE
 */
const bleScanResultSchema = z.object({
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

/**
 * Абстрактная платформа, реализующая функции взаимодействия с нативной мобильной средой.
 */
export abstract class MobilePlatform extends ClientPlatform {
  /**
   * Добавляет событие в системный календарь устройства.
   *
   * @param data Объект с параметрами события (начало, конец, описание и т.п.).
   */
  addEventToCalendar(data: {
    start: string | EpochTimeStamp;
    end?: string | EpochTimeStamp;
    summary: string;
    location?: string;
    description?: string;
  }) {
    this.client.outcomingMessage$.next(
      new MobileAddEventToCalendarMessage(data),
    );
  }

  /**
   * Инициирует загрузку CSV-файла с заданным именем и содержимым.
   *
   * @param filename Имя файла (с расширением .csv, будет добавлено при необходимости).
   * @param content Содержимое файла в виде двумерного массива строк.
   */
  downloadCsvContent(filename: string, content: string[][]) {
    this.client.outcomingMessage$.next(
      new MobileDownloadCsvContentMessage({
        filename: filename.endsWith(".csv") ? filename : filename + ".csv",
        content,
      }),
    );
  }

  /**
   * Инициирует загрузку файла по заданной ссылке.
   *
   * @param url Ссылка на файл.
   * @param filename Имя файла для сохранения.
   */
  downloadFile(url: string, filename: string) {
    this.client.outcomingMessage$.next(
      new MobileDownloadFileMessage({ url, filename }),
    );
  }

  /**
   * Делится содержимым через системное диалоговое окно обмена.
   *
   * @param data Объект с текстом, ссылкой и/или заголовком.
   */
  share(data: { url?: string; title?: string; text?: string }) {
    this.client.outcomingMessage$.next(new MobileShareMessage(data));
  }

  /**
   * Запрашивает геолокацию пользователя.
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
          if (unsafeMessage instanceof MobileGetGeolocationSuccessMessage) {
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
    this.client.outcomingMessage$.next(new MobileGetGeolocationMessage(scope));
  }

  /**
   * Запрашивает разрешение на push-уведомления и обрабатывает результат.
   *
   * @param config Объект с колбэками: `onGranted` при успехе, `onError` при ошибке.
   */
  registerPushNotifications(config: {
    onGranted: (token: { value: string }) => void;
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
            MobileRequestPushNotificationsActionGrantedMessage
          ) {
            const messagePayload = pushTokenGrantedMessageSchema.parse(
              unsafeMessage.payload,
            );
            config.onGranted(messagePayload.token);
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
      new MobileRequestPushNotificationsMessage(scope),
    );
  }

  /** Запрашивает сканирование BLE устройств.
   * @return Функция для остановки отслеживания. */
  requestBLEScan(config: {
    services?: (number | string)[];
    name?: string;
    namePrefix?: string;
    onReceive: (result: z.infer<typeof bleScanResultSchema>) => void;
    onError?: (text: string) => void;
  }): () => void {
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
          if (unsafeMessage instanceof MobileBleReceiveMessage) {
            const messagePayload = bleScanResultSchema.parse(
              unsafeMessage.payload,
            );
            config.onReceive(messagePayload);
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const messagePayload = errorMessagePayloadSchema.parse(
              unsafeMessage.payload,
            );
            if ("onError" in config) {
              config.onError!(messagePayload.message);
            }
            subscription.unsubscribe();
          }
        }),
      );
    this.client.outcomingMessage$.next(
      new MobileRequestBleScanMessage(scope, {
        services: config.services,
        name: config.name,
        namePrefix: config.namePrefix,
      }),
    );
    return () => {
      this.client.outcomingMessage$.next(new MobileStopMessage(scope));
    };
  }
  connectToBLEDevice(deviceId: string) {
    return new BLEDevice(deviceId, this.client);
  }
}

class BLEDevice {
  private scope = "ble-device-" + crypto.randomUUID();
  connect$ = new Subject<void>();
  error$ = new Subject<string>();
  disconnect$ = new Subject<void>();
  constructor(
    private id: string,
    private client: Client,
  ) {
    this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) &&
            unsafeMessage.target === this.scope,
        ),
        takeUntil(this.disconnect$),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          if (unsafeMessage instanceof MobileBleConnectMessage) {
            this.connect$.next();
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const payload = errorMessagePayloadSchema.parse(
              unsafeMessage.payload,
            );
            this.error$.next(payload.message);
            return;
          }
          if (unsafeMessage instanceof MobileBleDisconnectMessage) {
            this.disconnect$.next();
            this.connect$.complete();
            this.disconnect$.complete();
          }
        }),
      );
    this.client.outcomingMessage$.next(
      new MobileConnectToBleDeviceMessage(this.scope, { deviceId: this.id }),
    );
  }

  disconnect(): void {
    this.client.outcomingMessage$.next(
      new MobileDisconnectMessage(this.scope, { deviceId: this.id }),
    );
  }

  read(
    serviceId: number | string,
    characteristicId: number | string,
    config: {
      onReceive: (value: number) => void;
      onError?: (text: string) => void;
    },
  ): () => void {
    const scope = "platform-action-" + crypto.randomUUID();
    const subscription = this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) && unsafeMessage.target === scope,
        ),
        takeUntil(this.disconnect$),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          if (unsafeMessage instanceof MobileBleValueMessage) {
            const payload = z
              .strictObject({
                value: z.number(),
              })
              .parse(unsafeMessage.payload);
            config.onReceive(payload.value);
            subscription.unsubscribe();
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const payload = errorMessagePayloadSchema.parse(
              unsafeMessage.payload,
            );
            const errorText = payload.message;
            this.error$.next(errorText);
            if (typeof config.onError === "function") {
              config.onError(errorText);
            }
            subscription.unsubscribe();
          }
        }),
      );

    this.client.outcomingMessage$.next(
      new MobileReadBleCharacteristicMessage(scope, {
        deviceId: this.id,
        serviceId,
        characteristicId,
      }),
    );

    return () => {
      subscription.unsubscribe();
      this.client.outcomingMessage$.next(new MobileStopMessage(scope));
    };
  }

  getServices(config: {
    onReceive: (services: MobileBleService[]) => void;
    onError?: (text: string) => void;
  }): () => void {
    const scope = "platform-action-" + crypto.randomUUID();
    const subscription = this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) && unsafeMessage.target === scope,
        ),
        takeUntil(this.disconnect$),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          if (unsafeMessage instanceof MobileBleServicesMessage) {
            const payload = z
              .strictObject({ services: mobileBleServicesSchema })
              .parse(unsafeMessage.payload);
            config.onReceive(payload.services);
            subscription.unsubscribe();
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const payload = errorMessagePayloadSchema.parse(
              unsafeMessage.payload,
            );
            const errorText = payload.message;
            this.error$.next(errorText);
            if (typeof config.onError === "function") {
              config.onError(errorText);
            }
            subscription.unsubscribe();
          }
        }),
      );

    this.client.outcomingMessage$.next(
      new MobileGetBleServicesMessage(scope, { deviceId: this.id }),
    );

    return () => {
      subscription.unsubscribe();
      this.client.outcomingMessage$.next(new MobileStopMessage(scope));
    };
  }

  discoverServices(config: {
    onReceive: (services: MobileBleService[]) => void;
    onError?: (text: string) => void;
  }): () => void {
    const scope = "platform-action-" + crypto.randomUUID();
    const subscription = this.client.incomingMessage$
      .pipe(
        filter(
          (unsafeMessage) =>
            isTargetedMessage(unsafeMessage) && unsafeMessage.target === scope,
        ),
        takeUntil(this.disconnect$),
      )
      .subscribe(
        incomingMessageObserver(this.client, (unsafeMessage) => {
          if (unsafeMessage instanceof MobileBleServicesMessage) {
            const payload = z
              .strictObject({ services: mobileBleServicesSchema })
              .parse(unsafeMessage.payload);
            config.onReceive(payload.services);
            subscription.unsubscribe();
            return;
          }
          if (unsafeMessage instanceof ErrorMessage) {
            const payload = errorMessagePayloadSchema.parse(
              unsafeMessage.payload,
            );
            const errorText = payload.message;
            this.error$.next(errorText);
            if (typeof config.onError === "function") {
              config.onError(errorText);
            }
            subscription.unsubscribe();
          }
        }),
      );

    this.client.outcomingMessage$.next(
      new MobileDiscoverBleServicesMessage(scope, { deviceId: this.id }),
    );

    return () => {
      subscription.unsubscribe();
      this.client.outcomingMessage$.next(new MobileStopMessage(scope));
    };
  }
}
