import type {
  EntryServerComponentProperties,
  ServerComponentConfig,
} from "./server-component-config";
import type { WebMcpToolConfig } from "./web-mcp-tool-config";

export type { EntryServerComponentProperties };

/** Wire-config entry: страница, диалог или popover. */
export interface EntryServerComponentConfig extends ServerComponentConfig {
  tools?: WebMcpToolConfig[];
}
