import type { ServerComponentConfig } from "./server-component-config";
import type { WebMcpToolConfig } from "./web-mcp-tool-config";

/** Wire-config entry: страница, диалог или popover. */
export type EntryServerComponentConfig = ServerComponentConfig & {
  tools?: WebMcpToolConfig[];
};
