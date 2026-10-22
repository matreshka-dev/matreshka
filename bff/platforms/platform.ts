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
import type { PlatformEnumeratedDevice } from "@matreshka/shared/messages/client-to-bff/platforms/platform-enumerate-devices-success-message";
import { PlatformEnumerateDevicesSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-enumerate-devices-success-message";
import type { Observable } from "rxjs";
import { z } from "zod/v4";
import { Dialog, Popover } from "../components";
import { Overlay } from "../components/types/container-overlay";
import {
  Client,
  Componentable,
  ComponentInstance,
  ContextValueRef,
  runWithEntry,
  serializeOverlays,
} from "../core";
import {
  isPopoverShowPlacement,
  type PopoverShowComponent,
  type PopoverShowPlacement,
} from "./popover-show";
import { clientBackPlatformAction } from "./utils/client-back-platform-action";
import {
  clientNavigatePlatformAction,
  type NavigateResult,
} from "./utils/client-navigate-platform-action";
import { clientReloadPlatformAction } from "./utils/client-reload-platform-action";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";

export type { NavigateResult };

const enumeratedDeviceSchema = z.strictObject({
  kind: z.enum(["audioinput", "audiooutput", "videoinput"]),
  deviceId: z.string(),
  groupId: z.string(),
  label: z.string().optional(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

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
  navigate(path: string): Observable<NavigateResult> {
    return clientNavigatePlatformAction(this.client, path);
  }

  /** Переходит на предыдущую страницу в истории навигации клиента. */
  back(): Observable<void> {
    return clientBackPlatformAction(this.client);
  }

  /**
   * Перезагружает клиентское приложение.
   *
   * Завершение observable — {@link Client.reconnect$} (переподключение WS с тем же token),
   * а не ack с клиента до reload.
   */
  reload(): Observable<void> {
    return clientReloadPlatformAction(this.client);
  }

  /** Включает режим конфиденциальности. */
  enablePrivacyMode(): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new EnablePrivacyModeMessage(scope),
    });
  }

  /** Отключает режим конфиденциальности. */
  disablePrivacyMode(): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new DisablePrivacyModeMessage(scope),
    });
  }

  /** Явно включает светлую цветовую схему на клиенте. */
  setColorSchemeLight(): Observable<void> {
    return this.setColorScheme("light");
  }

  /** Явно включает тёмную цветовую схему на клиенте. */
  setColorSchemeDark(): Observable<void> {
    return this.setColorScheme("dark");
  }

  /** Сбрасывает выбор темы: снова используется системная схема. */
  setColorSchemeSystem(): Observable<void> {
    return this.setColorScheme("system");
  }

  private setColorScheme(mode: "light" | "dark" | "system"): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new PlatformSetColorSchemeMessage(scope, { mode }),
    });
  }

  /** Отображает диалоговое окно. */
  showDialog(dialog: Dialog): Observable<void> {
    const serializedDialog = dialog.serialize();
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new DialogShowMessage(scope, serializedDialog),
    });
  }

  /**
   * Отображает popover.
   *
   * **source** — элемент, инициировавший открытие (Tab-order, `showPopover({ source })` на клиенте).
   * **anchor** — визуальный якорь (`anchor-name` / `position-anchor`), если отличается от source.
   */
  showPopover(source: PopoverShowComponent, popover: Popover): Observable<void>;
  showPopover(
    placement: PopoverShowPlacement,
    popover: Popover,
  ): Observable<void>;
  showPopover(
    sourceOrPlacement: PopoverShowComponent | PopoverShowPlacement,
    popover: Popover,
  ): Observable<void> {
    const serializedPopover = popover.serialize();
    const wirePayload = isPopoverShowPlacement(sourceOrPlacement)
      ? {
          source: sourceOrPlacement.source.id,
          anchor: sourceOrPlacement.anchor.id,
          popover: serializedPopover,
        }
      : {
          source: sourceOrPlacement.id,
          popover: serializedPopover,
        };
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new PopoverShowMessage(scope, wirePayload),
    });
  }

  showDatePicker(
    anchor: ComponentInstance | Componentable,
    ref: ContextValueRef<string | undefined>,
  ): Observable<void> {
    return this.showNativePicker(anchor, "date", ref);
  }

  showColorPicker(
    anchor: ComponentInstance | Componentable,
    ref: ContextValueRef<string | undefined>,
  ): Observable<void> {
    return this.showNativePicker(anchor, "color", ref);
  }

  showTimePicker(
    anchor: ComponentInstance | Componentable,
    ref: ContextValueRef<string | undefined>,
  ): Observable<void> {
    return this.showNativePicker(anchor, "time", ref);
  }

  showDateTimePicker(
    anchor: ComponentInstance | Componentable,
    ref: ContextValueRef<string | undefined>,
  ): Observable<void> {
    return this.showNativePicker(anchor, "datetime-local", ref);
  }

  private showNativePicker(
    anchor: ComponentInstance | Componentable,
    inputType: PlatformNativePickerInputType,
    ref: ContextValueRef<string | undefined>,
  ): Observable<void> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new PlatformShowNativePickerMessage(scope, {
          component_id: anchor.id,
          inputType,
          ref: ref.toJSON(),
        }),
    });
  }

  /**
   * Задаёт платформенные оверлеи (anchors + component). Вложенные компоненты участвуют в поиске на сервере;
   * на клиент уходит массив конфигов, как у `properties.overlays` страницы.
   */
  setOverlays(overlays: Overlay[]): Observable<void> {
    for (const o of this.platformOverlays) {
      this.client.removeGlobalComponent(o.component);
    }
    this.platformOverlays = [...overlays];
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) =>
        new PlatformSetOverlaysMessage(scope, {
          overlays: runWithEntry(this.client.ensureAppOverlayEntry(), () =>
            serializeOverlays(this.platformOverlays),
          ),
        }),
    });
  }

  /**
   * Текущие платформенные оверлеи (как на странице: anchors + экземпляр component на BFF).
   */
  getOverlays(): readonly Overlay[] {
    return this.platformOverlays;
  }

  /**
   * Запрашивает у клиента список доступных media-устройств (navigator.mediaDevices.enumerateDevices()).
   *
   * Документация: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
   */
  enumerateDevices(): Observable<EnumeratedDeviceInstance[]> {
    return targetedClientPlatformAction(this.client, {
      outgoingMessage: (scope) => new PlatformEnumerateDevicesMessage(scope),
      parseSuccess: (unsafeMessage) => {
        if (unsafeMessage instanceof PlatformEnumerateDevicesSuccessMessage) {
          const payload = z
            .strictObject({
              devices: z.array(enumeratedDeviceSchema),
            })
            .parse(unsafeMessage.payload);
          return payload.devices.map((d) => toDeviceInstance(d));
        }
      },
    });
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
