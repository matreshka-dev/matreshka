import type { ServerComponentConfig } from "./server-component-config";
export type InputConfig = {
    properties: {
        ref: string;
    };
} & ServerComponentConfig;
