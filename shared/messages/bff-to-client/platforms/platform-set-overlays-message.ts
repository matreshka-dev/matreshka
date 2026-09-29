import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

/** Конфиги оверлея (anchors + сериализованный component), по смыслу как `properties.overlays` у страницы. */
export type PlatformSetOverlaysPayload = {
  overlays: unknown[];
};

/**
 * Установка платформенных оверлеев: вне страницы, переживают навигацию.
 */
export class PlatformSetOverlaysMessage extends PingableBffToClientMessage<PlatformSetOverlaysPayload> {
  static readonly type = "platform-set-overlays";
  constructor(public override readonly payload: PlatformSetOverlaysPayload) {
    super(payload);
  }
}
