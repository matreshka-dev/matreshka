import { WebMcpToolAnnotation } from "@matreshka/shared/enums/web-mcp-tool-annotation";
import type { BffToClientMessage } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message";
import { WebMcpToolErrorMessage } from "@matreshka/shared/messages/bff-to-client/webmcp/web-mcp-tool-error-message";
import { WebMcpToolResultMessage } from "@matreshka/shared/messages/bff-to-client/webmcp/web-mcp-tool-result-message";
import { WebMcpToolCallMessage } from "@matreshka/shared/messages/client-to-bff/webmcp/web-mcp-tool-call-message";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { z } from "zod/v4";
import { Client, runWithClient } from "../../core";
import { desktopDevice } from "../../core/conditions/desktop-device";
import { dialog } from "../dialog";
import { Page } from "../page";
import {
  WebMcpTool,
  webMcpTool,
  type WebMcpToolExecute,
  type WebMcpToolWithoutInput,
} from "./web-mcp-tool";

class ToolsPage extends Page {
  calls = 0;

  protected title(): string {
    return "Tools";
  }

  protected content() {
    return [];
  }

  protected override tools(): WebMcpTool[] {
    return [
      webMcpTool({
        name: "  get_order_status  ",
        description: "  Статус заказа  ",
        annotations: [WebMcpToolAnnotation.ReadOnlyHint],
        execute: async () => {
          this.calls += 1;
          return "pending";
        },
      }),
    ];
  }
}

class SameNamePage extends Page {
  protected title(): string {
    return "Same";
  }

  protected content() {
    return [];
  }

  protected override tools(): WebMcpTool[] {
    return [
      webMcpTool({
        name: "status",
        description: "First",
        execute: async () => "first",
      }),
      webMcpTool({
        name: "status",
        description: "Second",
        execute: async () => "second",
      }),
    ];
  }
}

class LateFieldPage extends Page {
  label = "ready";

  protected title(): string {
    return "Late";
  }

  protected content() {
    return [];
  }

  protected override tools(): WebMcpTool[] {
    return [
      webMcpTool({
        name: this.label,
        description: "Поле наследника уже есть",
        conditions: [desktopDevice()],
        execute: async () => "ok",
      }),
    ];
  }
}

class EmptyPage extends Page {
  protected title(): string {
    return "Empty";
  }

  protected content() {
    return [];
  }
}

class RejectingPage extends Page {
  protected title(): string {
    return "Reject";
  }

  protected content() {
    return [];
  }

  protected override tools(): WebMcpTool[] {
    return [
      webMcpTool({
        name: "fail",
        description: "Fails",
        execute: async () => {
          throw new Error("boom");
        },
      }),
    ];
  }
}

class NonStringPage extends Page {
  protected title(): string {
    return "Non string";
  }

  protected content() {
    return [];
  }

  protected override tools(): WebMcpTool[] {
    return [
      webMcpTool({
        name: "bad-result",
        description: "Returns a number",
        execute: (async () => 1) as unknown as WebMcpToolExecute,
      }),
    ];
  }
}

class SchemaPage extends Page {
  calls = 0;
  received: unknown;

  protected title(): string {
    return "Schema";
  }

  protected content() {
    return [];
  }

  protected override tools(): WebMcpTool[] {
    return [
      webMcpTool({
        name: "add_todo",
        description: "Добавляет задачу",
        inputSchema: z.object({ text: z.string() }),
        execute: async (input) => {
          const typed: { text: string } = input;
          // @ts-expect-error у входа нет лишнего поля
          const extra: { nope: string } = input;
          void extra;
          this.calls += 1;
          this.received = input;
          return typed.text;
        },
      }),
    ];
  }
}

function tool(overrides: Partial<WebMcpToolWithoutInput> = {}): WebMcpTool {
  return webMcpTool({
    name: "confirm",
    description: "Подтверждает действие",
    execute: async () => "ok",
    ...overrides,
  });
}

function typedConstructor(): WebMcpTool {
  return new WebMcpTool({
    name: "add_todo",
    description: "Добавляет задачу",
    inputSchema: z.object({ text: z.string() }),
    execute: async (input) => {
      const typed: { text: string } = input;
      // @ts-expect-error у входа нет лишнего поля
      const extra: { nope: string } = input;
      void extra;
      return typed.text;
    },
  });
}

void typedConstructor;

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("WebMCP tools", () => {
  it("создаётся и вызовом, и через new", () => {
    const called = webMcpTool({
      name: "called",
      description: "Вызов",
      execute: async () => "ok",
    });
    const constructed = new WebMcpTool({
      name: "constructed",
      description: "Конструктор",
      execute: async () => "ok",
    });

    expect(called).toBeInstanceOf(WebMcpTool);
    expect(constructed).toBeInstanceOf(WebMcpTool);
    expect(called.id).not.toBe(constructed.id);
  });

  it("сохраняет тулзы страницы и диалога и не вызывает execute до вызова", () => {
    const page = new ToolsPage();
    let dialogCalls = 0;
    const dlg = dialog({
      tools: [
        webMcpTool({
          name: "confirm",
          description: "Подтверждает действие",
          annotations: [WebMcpToolAnnotation.ConsequentialHint],
          execute: async () => {
            dialogCalls += 1;
            return "ok";
          },
        }),
      ],
      content: [],
    });

    expect(page.entryTools).toEqual([
      {
        id: page.entryTools[0]?.id,
        name: "get_order_status",
        description: "Статус заказа",
        execute: page.entryTools[0]?.execute,
        annotations: [WebMcpToolAnnotation.ReadOnlyHint],
        inputSchema: undefined,
        conditions: [],
      },
    ]);
    const storedId = page.entryTools[0]?.id;
    expect(page.entryTools[0]?.id).toBe(storedId);
    expect(dlg.entryTools).toHaveLength(1);
    expect(dlg.entryTools[0]?.annotations).toEqual([
      WebMcpToolAnnotation.ConsequentialHint,
    ]);
    expect(page.calls).toBe(0);
    expect(dialogCalls).toBe(0);

    const client = new Client();
    const pageId = page.entryTools[0].id;
    const config = runWithClient(client, () => page.serialize());
    const dialogConfig = runWithClient(client, () => dlg.serialize());

    expect(page.calls).toBe(0);
    expect(dialogCalls).toBe(0);
    expect(page.entryTools[0]?.id).toBe(pageId);
    expect(config.tools).toEqual([
      {
        id: pageId,
        name: "get_order_status",
        description: "Статус заказа",
        annotations: [WebMcpToolAnnotation.ReadOnlyHint],
      },
    ]);
    expect(dialogConfig.tools?.[0]).toEqual({
      id: dlg.entryTools[0]?.id,
      name: "confirm",
      description: "Подтверждает действие",
      annotations: [WebMcpToolAnnotation.ConsequentialHint],
    });
    expect(JSON.stringify(config)).not.toContain("execute");
    expect(JSON.stringify(dialogConfig)).not.toContain("execute");
  });

  it("оставляет entry без тулзов пустым и не пишет tools в config", () => {
    const page = new EmptyPage();
    const client = new Client();
    const config = runWithClient(client, () => page.serialize());

    expect(page.entryTools).toEqual([]);
    expect(config.tools).toBeUndefined();
  });

  it("сохраняет два тулза с одним именем и разными id", () => {
    const page = new SameNamePage();

    expect(page.entryTools.map((item) => item.name)).toEqual([
      "status",
      "status",
    ]);
    expect(page.entryTools[0]?.annotations).toEqual([]);
    expect(page.entryTools[0]?.id).not.toBe(page.entryTools[1]?.id);
  });

  it("бросает ZodError на пустое имя, пустое описание и повтор аннотации", () => {
    expect(() =>
      dialog({
        content: [],
        tools: [tool({ name: "   " })],
      }),
    ).toThrow(ZodError);
    expect(() =>
      dialog({
        content: [],
        tools: [tool({ description: " " })],
      }),
    ).toThrow(ZodError);
    expect(() =>
      dialog({
        content: [],
        tools: [
          tool({
            annotations: [
              WebMcpToolAnnotation.ReadOnlyHint,
              WebMcpToolAnnotation.ReadOnlyHint,
            ],
          }),
        ],
      }),
    ).toThrow(ZodError);
  });

  it("после вызова отвечает строкой execute и callId входящего сообщения", async () => {
    const page = new ToolsPage();
    const client = new Client();
    runWithClient(client, () => page.serialize());
    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));

    const call = new WebMcpToolCallMessage(page.entryTools[0].id);
    client.incomingMessage$.next(call);
    await flushMicrotasks();

    expect(page.calls).toBe(1);
    expect(outgoing).toHaveLength(1);
    const result = outgoing[0];
    expect(result).toBeInstanceOf(WebMcpToolResultMessage);
    if (!(result instanceof WebMcpToolResultMessage)) {
      return;
    }
    expect(result.target).toBe(page.entryTools[0]?.id);
    expect(result.payload).toEqual({
      result: "pending",
      callId: call.id,
    });
  });

  it("на reject execute отвечает ошибкой и не шлёт result", async () => {
    const page = new RejectingPage();
    const client = new Client();
    runWithClient(client, () => page.serialize());
    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));

    const call = new WebMcpToolCallMessage(page.entryTools[0].id);
    client.incomingMessage$.next(call);
    await flushMicrotasks();

    expect(outgoing).toHaveLength(1);
    const error = outgoing[0];
    expect(error).toBeInstanceOf(WebMcpToolErrorMessage);
    if (!(error instanceof WebMcpToolErrorMessage)) {
      return;
    }
    expect(error.target).toBe(page.entryTools[0]?.id);
    expect(error.payload).toEqual({
      message: "boom",
      callId: call.id,
    });
  });

  it("на нестроковый результат отвечает ошибкой", async () => {
    const page = new NonStringPage();
    const client = new Client();
    runWithClient(client, () => page.serialize());
    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));

    client.incomingMessage$.next(
      new WebMcpToolCallMessage(page.entryTools[0].id),
    );
    await flushMicrotasks();

    expect(outgoing).toHaveLength(1);
    expect(outgoing[0]).toBeInstanceOf(WebMcpToolErrorMessage);
    expect((outgoing[0] as WebMcpToolErrorMessage).payload.message).toBe(
      "WebMCP tool execute must resolve to a string",
    );
  });

  it("не отвечает на неизвестный id", async () => {
    const page = new ToolsPage();
    const client = new Client();
    runWithClient(client, () => page.serialize());
    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));

    client.incomingMessage$.next(
      new WebMcpToolCallMessage(crypto.randomUUID()),
    );
    await flushMicrotasks();

    expect(page.calls).toBe(0);
    expect(outgoing).toEqual([]);
  });

  it("собирает tools страницы после конструктора и сериализует conditions", () => {
    const page = new LateFieldPage();
    const client = new Client();
    const config = runWithClient(client, () => page.serialize());

    expect(page.entryTools[0]?.name).toBe("ready");
    expect(config.tools?.[0]?.conditions).toEqual([
      { type: "desktop-device", payload: {} },
    ]);
  });

  it("сериализует Zod-схему и передаёт проверенный input в execute", async () => {
    const page = new SchemaPage();
    const client = new Client();
    const config = runWithClient(client, () => page.serialize());

    expect(config.tools?.[0]?.inputSchema).toMatchObject({
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
    });
    expect(page.calls).toBe(0);

    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));
    const call = new WebMcpToolCallMessage(page.entryTools[0].id, {
      input: { text: "Купить молоко" },
    });
    client.incomingMessage$.next(call);
    await flushMicrotasks();

    expect(page.calls).toBe(1);
    expect(page.received).toEqual({ text: "Купить молоко" });
    expect(outgoing[0]).toBeInstanceOf(WebMcpToolResultMessage);
    expect((outgoing[0] as WebMcpToolResultMessage).payload.result).toBe(
      "Купить молоко",
    );
  });

  it("не вызывает execute, если input не соответствует схеме", async () => {
    const page = new SchemaPage();
    const client = new Client();
    runWithClient(client, () => page.serialize());
    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));

    client.incomingMessage$.next(
      new WebMcpToolCallMessage(page.entryTools[0].id, {
        input: { text: 1 },
      }),
    );
    await flushMicrotasks();

    expect(page.calls).toBe(0);
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0]).toBeInstanceOf(WebMcpToolErrorMessage);
    expect(
      (outgoing[0] as WebMcpToolErrorMessage).payload.message.length,
    ).toBeGreaterThan(0);
  });
});
