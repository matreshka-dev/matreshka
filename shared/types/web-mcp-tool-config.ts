import type { WebMcpToolAnnotation } from "../enums/web-mcp-tool-annotation";
import type { Condition } from "./condition";

/** Метаданные WebMCP-тулза в config entry. Функция execute остаётся на BFF. */
export type WebMcpToolConfig = {
  id: string;
  name: string;
  description: string;
  annotations: WebMcpToolAnnotation[];
  /** JSON Schema входных параметров. Нет, если автор не задал Zod-схему. */
  inputSchema?: Record<string, unknown>;
  /** Условия доступности. Пусто или отсутствует — тулз доступен всегда. */
  conditions?: Condition[];
};
