import type { WebMcpToolAnnotation } from "../enums/web-mcp-tool-annotation";
import type { Condition } from "./condition";
export type WebMcpToolConfig = {
    id: string;
    name: string;
    description: string;
    annotations: WebMcpToolAnnotation[];
    inputSchema?: Record<string, unknown>;
    conditions?: Condition[];
};
