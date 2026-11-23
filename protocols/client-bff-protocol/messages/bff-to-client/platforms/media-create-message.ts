import { MediaCrossOrigin } from "../../../enums/media-cross-origin";
import { MediaKind } from "../../../enums/media-kind";
import { MediaPreload } from "../../../enums/media-preload";
import type { ServerComponentInteraction } from "../../../types/server-component-interaction";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

/** Начальные свойства `HTMLMediaElement`, без обработчиков. */
export type MediaElementConfig = {
  src?: string;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  playbackRate?: number;
  preload?: MediaPreload;
  crossOrigin?: MediaCrossOrigin;
  autoplay?: boolean;
};

export type MediaCreatePayload = {
  mediaId: string;
  kind: MediaKind;
  config: MediaElementConfig;
  /** Сериализованные действия по имени DOM-события (`timeupdate`, `ended`, …). */
  interactions: Record<string, ServerComponentInteraction[]>;
};

export class MediaCreateMessage extends PingableTargetedBffToClientMessage<MediaCreatePayload> {
  static readonly type = "media-create";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaCreatePayload,
  ) {
    super(target, payload);
  }
}
