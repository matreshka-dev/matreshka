import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export type TelegramMiniAppGetGeolocationSuccessPayload = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  course: number | null;
  speed: number | null;
  horizontal_accuracy: number | null;
  vertical_accuracy: number | null;
  course_accuracy: number | null;
  speed_accuracy: number | null;
};

export class TelegramMiniAppGetGeolocationSuccessMessage extends PingableTargetedClientToBffMessage<TelegramMiniAppGetGeolocationSuccessPayload> {
  static readonly type = "telegram-mini-app-platform-get-geolocation-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: TelegramMiniAppGetGeolocationSuccessPayload,
  ) {
    super(target, payload);
  }
}
