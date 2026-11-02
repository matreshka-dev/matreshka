import type { PageConfig } from "../../../types/page-config";
import { ReliableBffToClientMessage } from "../reliable-bff-to-client-message";
export declare class AppPageMessage extends ReliableBffToClientMessage<PageConfig> {
    readonly payload: PageConfig;
    static readonly type = "page";
    constructor(payload: PageConfig);
}
