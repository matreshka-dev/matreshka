import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

/** Конфиги оверлея (anchors + сериализованный component), по смыслу как `properties.overlays` у страницы. */
export type PlatformSetOverlaysPayload = {
  overlays: unknown[];
};

/**
 * Установка платформенных оверлеев: вне страницы, переживают навигацию.
 */
export class PlatformSetOverlaysMessage extends PingableTargetedBffToClientMessage<PlatformSetOverlaysPayload> {
  static readonly type = "platform-set-overlays";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformSetOverlaysPayload,
  ) {
    super(target, payload);
  }
}
