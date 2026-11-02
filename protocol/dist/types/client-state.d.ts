import { PlatformId } from "../enums/platform-id";
export type ClientState = {
    route: {
        visitedAt: number;
        path: string;
        query: {
            [key: string]: string;
        };
    };
    storage: Record<string, string>;
    language: string;
    userAgent: string;
    prefersColorScheme: "light" | "dark" | "system";
    platform: {
        id: PlatformId;
        payload: unknown;
    };
};
