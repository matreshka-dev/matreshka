import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { VideoFacingMode } from "@matreshka/shared/enums/video-facing-mode";
import { CameraSwitchMessage } from "@matreshka/shared/messages/bff-to-client/components/camera/camera-switch-message";
import { ErrorMessagePayload } from "@matreshka/shared/messages/client-to-bff/error-message";
import type { CameraConfig } from "@matreshka/shared/types/camera-config";
import {
  calculateComponents,
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  serializeOverlays,
  StandaloneComponent,
} from "../core";
import { VideoInputDevice } from "../platforms/platform";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
  ServerComponentAction,
} from "./component";
import { Overlay } from "./types/container-overlay";

export { VideoFacingMode } from "@matreshka/shared/enums/video-facing-mode";

export type CameraProperties = {
  content: ComponentTreeNode[];
  overlays?: Overlay[];
  facingMode?: VideoFacingMode;
} & ComponentProperties;

/**
 * Конфигурация инициализации для компонента Camera.
 *
 * @template T Тип вложенных компонентов.
 * @property content Массив вложенных компонентов.
 */
export type CameraInitConfig<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
  ComponentType extends Componentable = Camera,
  PropertiesType extends CameraProperties = CameraProperties,
> = {
  /**
   * Предпочитаемая камера устройства.
   * Пробрасывается в клиентский `getUserMedia` как `video.facingMode`.
   *
   * Полезно для кейсов вроде сканирования QR (обычно нужна задняя камера: `"environment"`).
   */
  facingMode?: VideoFacingMode;
  overlays?: Overlay[];
  content: MixedWithCallbacksArray<ContentType>;
  /**
   * Обработчики события распознавания QR-кода на клиенте.
   * В payload приходит строковое значение распознанного QR-кода.
   */
  onQrCode?:
    | ServerComponentAction<ComponentType, string>
    | ServerComponentAction<ComponentType, string>[];
  /**
   * Событие: на клиенте сменился активный девайс камеры.
   * В payload приходит объект `{ deviceId: string }`.
   */
  onDeviceChange?:
    | ServerComponentAction<ComponentType, { deviceId: string }>
    | ServerComponentAction<ComponentType, { deviceId: string }>[];
  /**
   * Событие: ошибка работы камеры.
   * В payload приходит объект `ErrorMessagePayload` (code, message?).
   */
  onError?:
    | ServerComponentAction<ComponentType, ErrorMessagePayload>
    | ServerComponentAction<ComponentType, ErrorMessagePayload>[];
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
> = CameraInitConfig<ContentType, Camera>;

export function camera<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(content: DefaultInitConfigType<ContentType>["content"]): Camera<ContentType>;
export function camera<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(
  options: Omit<DefaultInitConfigType<ContentType>, "content">,
  content: DefaultInitConfigType<ContentType>["content"],
): Camera<ContentType>;
export function camera<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(config: DefaultInitConfigType<ContentType>): Camera<ContentType>;
export function camera<
  ContentType extends ComponentTreeNode = ComponentTreeNode,
>(
  arg0:
    | DefaultInitConfigType<ContentType>["content"]
    | Omit<DefaultInitConfigType<ContentType>, "content">
    | DefaultInitConfigType<ContentType>,
  arg1?: DefaultInitConfigType<ContentType>["content"],
): Camera<ContentType> {
  if (arg1 !== undefined) {
    return new Camera<ContentType>({
      ...(arg0 as Omit<DefaultInitConfigType<ContentType>, "content">),
      content: arg1,
    });
  }
  const single = arg0;
  if (
    typeof single === "object" &&
    single !== null &&
    !Array.isArray(single) &&
    "content" in single
  ) {
    return new Camera<ContentType>(single);
  }
  return new Camera<ContentType>({
    content: single as DefaultInitConfigType<ContentType>["content"],
  });
}

/**
 * Компонент камеры (контейнер), на клиенте отображает видео с веб-камеры устройства.
 */
export class Camera<
    ContentType extends ComponentTreeNode = ComponentTreeNode,
    InitConfigType extends CameraInitConfig<
      ContentType,
      any
    > = DefaultInitConfigType<ContentType>,
    PropertiesType extends CameraProperties = CameraProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: InitConfigType) {
    super(config);
    if (config.onQrCode) {
      // bindActions в базовом Component типизирован под payload=unknown.
      // Здесь payload всегда строка QR-кода, поэтому безопасно расширяем тип.
      const actions = config.onQrCode as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("qr-code", actions);
    }
    if (config.onDeviceChange) {
      const actions = config.onDeviceChange as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("device-change", actions);
    }
    if (config.onError) {
      const actions = config.onError as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("error", actions);
    }
  }

  /**
   * Возвращает уникальный идентификатор класса компонента.
   * @returns Строка `"camera"`.
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Camera;
  }

  /**
   * Возвращает флаг, указывающий, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(initValues.content),
      overlays: initValues.overlays,
      facingMode: initValues.facingMode,
    };
  }

  /**
   * Отправляет на клиент команду переключения активной камеры устройства на указанную.
   */
  switchCamera(device: VideoInputDevice, instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new CameraSwitchMessage(instance.id, {
              deviceId: device.deviceId,
            }),
          );
        });
    } else {
      this.broadcast(
        new CameraSwitchMessage(this.id, {
          deviceId: device.deviceId,
        }),
      );
    }
    return this;
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = { ...overrides };
    if (overrides.content !== undefined) {
      out.content = serializeComponentList(overrides.content);
    }
    if (overrides.overlays !== undefined) {
      out.overlays = serializeOverlays(overrides.overlays);
    }
    return out;
  }

  serialize(): CameraConfig {
    const result = super.serialize();
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.Camera,
      properties: {
        ...p,
        content: serializeComponentList(p.content),
        overlays: p.overlays ? serializeOverlays(p.overlays) : undefined,
      },
    };
  }
}
