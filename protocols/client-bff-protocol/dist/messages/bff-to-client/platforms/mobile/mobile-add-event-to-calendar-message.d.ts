import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileAddEventToCalendarPayload = {
    start: string | number;
    end?: string | number;
    summary: string;
    location?: string;
    description?: string;
};
export declare class MobileAddEventToCalendarMessage extends PingableTargetedBffToClientMessage<MobileAddEventToCalendarPayload> {
    readonly target: string;
    readonly payload: MobileAddEventToCalendarPayload;
    static readonly type = "mobile-add-event-to-calendar";
    constructor(target: string, payload: MobileAddEventToCalendarPayload);
}
