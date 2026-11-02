import type { ServerComponentConfig } from "./server-component-config";
import type { WebMcpToolConfig } from "./web-mcp-tool-config";
export type EntryServerComponentConfig = ServerComponentConfig & {
    tools?: WebMcpToolConfig[];
};
