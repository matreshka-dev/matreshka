import {
  AppBackMessage,
  AppNavigateMessage,
  AppReloadMessage,
} from "@matreshka/shared/messages/bff-to-client/app/index";
import { DialogShowMessage } from "@matreshka/shared/messages/bff-to-client/components/dialog/dialog-show-message";
import { PopoverShowMessage } from "@matreshka/shared/messages/bff-to-client/components/popover/popover-show-message";
import { DisablePrivacyModeMessage } from "@matreshka/shared/messages/bff-to-client/platforms/disable-privacy-mode-message";
import { EnablePrivacyModeMessage } from "@matreshka/shared/messages/bff-to-client/platforms/enable-privacy-mode-message";
import { PlatformEnumerateDevicesMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-enumerate-devices-message";
import { PlatformSetColorSchemeMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-set-color-scheme-message";
import { PlatformSetOverlaysMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-set-overlays-message";
import {
  PlatformNativePickerInputType,
  PlatformShowNativePickerMessage,
} from "@matreshka/shared/messages/bff-to-client/platforms/platform-show-native-picker-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import {
  PlatformEnumeratedDevice,
  PlatformEnumerateDevicesSuccessMessage,
} from "@matreshka/shared/messages/client-to-bff/platforms/platform-enumerate-devices-success-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import { filter } from "rxjs";
import { z } from "zod/v4";
import { Dialog, Popover } from "../components";
import { Overlay } from "../components/types/container-overlay";
import {
  Client,
  Componentable,
  ComponentInstance,
  NativePickerValueRef,
  runWithEntry,
  serializeOverlays,
} from "../core";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";

/**
 * Абстрактный класс платформы, управляющий клиентом и его состоянием.
 */
export abstract class Platform {
  private platformOverlays: Overlay[] = [];

  /**
   * Активный клиент, связанный с платформой.
   */
  constructor(protected readonly client: Client) {}

  /**
   * Выполняет навигацию по указанному пути.
   *
   * @param path Путь, по которому необходимо перейти.
   */
  navigate(path: string) {
    this.client.outcomingMessage$.next(new AppNavigateMessage({ path }));
  }

  /**
   * Переходит на предыдущую страницу в истории навигации клиента.
   */
  back() {
    this.client.outcomingMessage$.next(new AppBackMessage());
  }

  /**
   * Перезагружает клиентское приложение.
   */
  reload() {
    this.client.outcomingMessage$.next(new AppReloadMessage());
  }

  /**
   * Включает режим конфиденциальности.
   */
  enablePrivacyMode() {
    this.client.outcomingMessage$.next(new EnablePrivacyModeMessage());
  }

  /**
   * Отключает режим конфиденциальности.
   */
  disablePrivacyMode() {
    this.client.outcomingMessage$.next(new DisablePrivacyModeMessage());
  }

  /**
   * Явно включает светлую цветовую схему на клиенте.
   */
  setColorSchemeLight() {
    this.client.outcomingMessage$.next(
      new PlatformSetColorSchemeMessage({ mode: "light" }),
    );
  }

  /**
   * Явно включает тёмную цветовую схему на клиенте.
   */
  setColorSchemeDark() {
    this.client.outcomingMessage$.next(
      new PlatformSetColorSchemeMessage({ mode: "dark" }),
    );
  }

  /**
   * Сбрасывает выбор темы: снова используется системная схема.
   */
  setColorSchemeSystem() {
    this.client.outcomingMessage$.next(
      new PlatformSetColorSchemeMessage({ mode: "system" }),
    );
  }

  /**
   * Отображает диалоговое окно.
   *
   * @param dialog Компонент диалога.
   */
  showDialog(dialog: Dialog) {
    const serializedDialog = dialog.serialize();
    this.client.outcomingMessage$.next(new DialogShowMessage(serializedDialog));
  }

  /**
   * Отображает всплывающее окно (popover) относительно заданного якоря.
   *
   * @param anchor Использование компонента-якоря на клиенте ({@link ComponentInstance.id}).
   * @param popover Компонент всплывающего окна.
   */
  showPopover(anchor: ComponentInstance | Componentable, popover: Popover) {
    const serializedPopover = popover.serialize();
    this.client.outcomingMessage$.next(
      new PopoverShowMessage({
        component_id: anchor.id,
        popover: serializedPopover,
      }),
    );
  }

  showDatePicker(
    anchor: ComponentInstance | Componentable,
    ref: NativePickerValueRef,
  ) {
    this.emitNativePickerCommand(anchor, "date", ref);
  }

  showColorPicker(
    anchor: ComponentInstance | Componentable,
    ref: NativePickerValueRef,
  ) {
    this.emitNativePickerCommand(anchor, "color", ref);
  }

  showTimePicker(
    anchor: ComponentInstance | Componentable,
    ref: NativePickerValueRef,
  ) {
    this.emitNativePickerCommand(anchor, "time", ref);
  }

  showDateTimePicker(
    anchor: ComponentInstance | Componentable,
    ref: NativePickerValueRef,
  ) {
    this.emitNativePickerCommand(anchor, "datetime-local", ref);
  }

  private emitNativePickerCommand<T extends PlatformNativePickerInputType>(
    anchor: ComponentInstance | Componentable,
    inputType: T,
    ref: NativePickerValueRef,
  ) {
    this.client.outcomingMessage$.next(
      new PlatformShowNativePickerMessage({
        component_id: anchor.id,
        inputType,
        ref: ref.toJSON(),
      }),
    );
  }

  /**
   * Задаёт платформенные оверлеи (anchors + component). Вложенные компоненты участвуют в поиске на сервере;
   * на клиент уходит массив конфигов, как у `properties.overlays` страницы.
   */
  setOverlays(overlays: Overlay[]) {
    for (const o of this.platformOverlays) {
      this.client.removeGlobalComponent(o.component);
    }
    this.platformOverlays = [...overlays];
    this.client.outcomingMessage$.next(
      new PlatformSetOverlaysMessage({
        overlays: runWithEntry(this.client.ensureAppOverlayEntry(), () =>
          serializeOverlays(this.platformOverlays),
        ),
      }),
    );
  }

  /**
   * Текущие платформенные оверлеи (как на странице: anchors + экземпляр component на BFF).
   */
  getOverlays(): readonly Overlay[] {
    return this.platformOverlays;
  }

  /**
   * Запрашивает у клиента список доступных media-устройств (navigator.mediaDevices.enumerateDevices()).
   * Клиент возвращает нормализованный список устройств + capabilities/settings где доступно.
   *
   * Документация: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
   */
  enumerateDevices(config: {
    onSuccess: (devices: EnumeratedDeviceInstance[]) => void;
    onError?: (text: string) => void;
  }) {
    const scope = "platform-action-" + crypto.randomUUID();

    const deviceSchema = z.strictObject({
      kind: z.enum(["audioinput", "audiooutput", "videoinput"]),
      deviceId: z.string(),
      groupId: z.string(),
      label: z.string().optional(),
      // capabilities/settings сильно зависят от браузера; валидируем как JSON-подобные объекты
      capabilities: z.record(z.string(), z.unknown()).optional(),
      settings: z.record(z.string(), z.unknown()).optional(),
    });

    const successPayloadSchema = z.strictObject({
      devices: z.array(deviceSchema),
    });

    const errorPayloadSchema = z.strictObject({
      message: z.string(),
    });

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
          if (unsafeMessage instanceof PlatformEnumerateDevicesSuccessMessage) {
            const payload = successPayloadSchema.parse(unsafeMessage.payload);
            config.onSuccess(payload.devices.map((d) => toDeviceInstance(d)));
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

    this.client.outcomingMessage$.next(
      new PlatformEnumerateDevicesMessage(scope),
    );
  }
}

/**
 * Инстансы устройств после валидации. Это удобнее сырых объектов:
 * - можно делать проверки через `instanceof`
 * - при необходимости добавить методы/геттеры без изменения протокола
 */
export type EnumeratedDeviceInstance =
  | AudioInputDevice
  | VideoInputDevice
  | AudioOutputDevice;

abstract class PlatformDeviceBase {
  constructor(protected readonly raw: PlatformEnumeratedDevice) {}
  get deviceId() {
    return this.raw.deviceId;
  }
  get groupId() {
    return this.raw.groupId;
  }
  get label() {
    return this.raw.label;
  }
  get capabilities() {
    return this.raw.capabilities;
  }
  get settings() {
    return this.raw.settings;
  }
  toJSON() {
    return this.raw;
  }
}

export class AudioInputDevice extends PlatformDeviceBase {}

export class VideoInputDevice extends PlatformDeviceBase {}

export class AudioOutputDevice extends PlatformDeviceBase {}

function toDeviceInstance(
  d: PlatformEnumeratedDevice,
): EnumeratedDeviceInstance {
  switch (d.kind) {
    case "audioinput":
      return new AudioInputDevice(d);
    case "videoinput":
      return new VideoInputDevice(d);
    case "audiooutput":
      return new AudioOutputDevice(d);
  }
}
