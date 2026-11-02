import { WebMcpToolAnnotation } from "@matreshka/shared/enums/web-mcp-tool-annotation";
import { WebMcpToolErrorMessage } from "@matreshka/shared/messages/bff-to-client/webmcp/web-mcp-tool-error-message";
import { WebMcpToolResultMessage } from "@matreshka/shared/messages/bff-to-client/webmcp/web-mcp-tool-result-message";
import type { Condition as SerializedCondition } from "@matreshka/shared/types/condition";
import type { WebMcpToolConfig } from "@matreshka/shared/types/web-mcp-tool-config";
import * as crypto from "node:crypto";
import { z } from "zod/v4";
import type { Client } from "../../core/client";
import { Condition } from "../../core/conditions/condition";

export { WebMcpToolAnnotation };

export type WebMcpToolExecute = () => Promise<string>;

export type WebMcpToolConditions = Condition[] | (() => Condition[]);

type WebMcpToolBase = {
  name: string;
  description: string;
  annotations?: readonly WebMcpToolAnnotation[];
  conditions?: WebMcpToolConditions;
};

/** MCP: латиница, цифры, `-`, `_` (после trim). */
const WEB_MCP_TOOL_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Тулз со схемой аргументов. Тип `execute` выводится из схемы. */
export type WebMcpToolWithInput<TSchema extends z.ZodType> = WebMcpToolBase & {
  inputSchema: TSchema;
  execute: (input: z.output<TSchema>) => Promise<string>;
};

/** Тулз без аргументов. */
export type WebMcpToolWithoutInput = WebMcpToolBase & {
  inputSchema?: undefined;
  execute: WebMcpToolExecute;
};

/** Аргумент `webMcpTool()` и `new WebMcpTool()`. */
export type WebMcpToolInit<TSchema extends z.ZodType | undefined = undefined> =
  TSchema extends z.ZodType
    ? WebMcpToolWithInput<TSchema>
    : WebMcpToolWithoutInput;

const webMcpToolSchema = z.object({
  name: z.string().trim().min(1).regex(WEB_MCP_TOOL_NAME_PATTERN, {
    message:
      "Tool name must contain only Latin letters, digits, hyphens (-), and underscores (_)",
  }),
  description: z.string().trim().min(1),
  annotations: z
    .array(z.enum(WebMcpToolAnnotation))
    .refine((items) => new Set(items).size === items.length, {
      message: "Annotations must be unique",
    })
    .optional()
    .default([]),
});

type StoredExecute = (input?: unknown) => Promise<string>;

/**
 * WebMCP-тулз entry или платформы.
 * `webMcpTool({ ... })` и `new WebMcpTool({ ... })` создают один и тот же класс.
 * id назначается при создании, автор его не задаёт.
 * По `inputSchema` TypeScript выводит тип аргумента `execute`.
 *
 * Параметр схемы по умолчанию `any`, чтобы тулз с конкретной схемой
 * можно было положить в `WebMcpTool[]`.
 */
export class WebMcpTool<TSchema extends z.ZodType | undefined = any> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly annotations: readonly WebMcpToolAnnotation[];
  readonly execute: StoredExecute;
  readonly inputSchema?: z.ZodType;
  readonly conditions: SerializedCondition[];

  constructor(init: WebMcpToolInit<TSchema>) {
    const parsed = webMcpToolSchema.parse({
      name: init.name,
      description: init.description,
      annotations: init.annotations,
    });
    this.id = crypto.randomUUID();
    this.name = parsed.name;
    this.description = parsed.description;
    this.annotations = parsed.annotations;
    this.execute = init.execute;
    this.inputSchema = init.inputSchema;
    this.conditions = resolveWebMcpToolConditions(init.conditions);
  }

  /**
   * Метаданные тулза для клиента. `execute` не включается.
   */
  serialize(): WebMcpToolConfig {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      annotations: [...this.annotations],
      ...(this.inputSchema
        ? { inputSchema: webMcpInputJsonSchema(this.inputSchema) }
        : {}),
      ...(this.conditions.length > 0 ? { conditions: this.conditions } : {}),
    };
  }
}

/** Функциональный вызов {@link WebMcpTool}. */
export function webMcpTool<TSchema extends z.ZodType | undefined = undefined>(
  init: WebMcpToolInit<TSchema>,
): WebMcpTool<TSchema> {
  return new WebMcpTool(init);
}

function resolveWebMcpToolConditions(
  conditions: WebMcpToolConditions | undefined,
): SerializedCondition[] {
  const list =
    typeof conditions === "function" ? conditions() : (conditions ?? []);
  return list.map((condition) => condition.toJSON());
}

export function webMcpInputJsonSchema(
  schema: z.ZodType,
): Record<string, unknown> {
  return z.toJSONSchema(schema);
}

/** Проверяет input, вызывает execute и отвечает клиенту результатом или ошибкой. */
export async function dispatchWebMcpToolCall(
  client: Client,
  tool: WebMcpTool,
  callId: string,
  input: unknown,
): Promise<void> {
  let parsedInput: unknown;
  if (tool.inputSchema) {
    const parsed = tool.inputSchema.safeParse(input);
    if (!parsed.success) {
      client.outcomingMessage$.next(
        new WebMcpToolErrorMessage(tool.id, {
          message: parsed.error.message,
          callId,
        }),
      );
      return;
    }
    parsedInput = parsed.data;
  }

  try {
    const result: unknown = tool.inputSchema
      ? await tool.execute(parsedInput)
      : await tool.execute();
    if (typeof result !== "string") {
      client.outcomingMessage$.next(
        new WebMcpToolErrorMessage(tool.id, {
          message: "WebMCP tool execute must resolve to a string",
          callId,
        }),
      );
      return;
    }
    client.outcomingMessage$.next(
      new WebMcpToolResultMessage(tool.id, { result, callId }),
    );
  } catch (error) {
    client.outcomingMessage$.next(
      new WebMcpToolErrorMessage(tool.id, {
        message: webMcpToolErrorText(error),
        callId,
      }),
    );
  }
}

export function webMcpToolErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
