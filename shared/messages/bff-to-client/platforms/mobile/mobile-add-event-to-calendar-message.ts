import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileAddEventToCalendarPayload = {
  start: string | number;
  end?: string | number;
  summary: string;
  location?: string;
  description?: string;
};

export class MobileAddEventToCalendarMessage extends PingableBffToClientMessage<MobileAddEventToCalendarPayload> {
  static readonly type = "mobile-add-event-to-calendar";
  constructor(
    public override readonly payload: MobileAddEventToCalendarPayload,
  ) {
    super(payload);
  }
}
