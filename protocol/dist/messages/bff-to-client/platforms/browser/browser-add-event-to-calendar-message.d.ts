import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type BrowserAddEventToCalendarPayload = {
    start: string | number;
    end?: string | number;
    summary: string;
    location?: string;
    description?: string;
};
export declare class BrowserAddEventToCalendarMessage extends PingableTargetedBffToClientMessage<BrowserAddEventToCalendarPayload> {
    readonly target: string;
    readonly payload: BrowserAddEventToCalendarPayload;
    static readonly type = "browser-add-event-to-calendar";
    constructor(target: string, payload: BrowserAddEventToCalendarPayload);
}
