import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserAddEventToCalendarPayload = {
  start: string | number; // Date string or EpochTimeStamp
  end?: string | number; // Date string or EpochTimeStamp
  summary: string;
  location?: string;
  description?: string;
};

export class BrowserAddEventToCalendarMessage extends PingableTargetedBffToClientMessage<BrowserAddEventToCalendarPayload> {
  static readonly type = "browser-add-event-to-calendar";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserAddEventToCalendarPayload,
  ) {
    super(target, payload);
  }
}
