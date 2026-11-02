import type { BffToClientMessage } from "@matreshka/protocol/messages/bff-to-client/bff-to-client-message";
import { PlatformSetToolsMessage } from "@matreshka/protocol/messages/bff-to-client/platforms/platform-set-tools-message";
import { WebMcpToolResultMessage } from "@matreshka/protocol/messages/bff-to-client/webmcp/web-mcp-tool-result-message";
import { ActionCompletedMessage } from "@matreshka/protocol/messages/client-to-bff/action-completed-message";
import { WebMcpToolCallMessage } from "@matreshka/protocol/messages/client-to-bff/webmcp/web-mcp-tool-call-message";
import { firstValueFrom } from "rxjs";
import { describe, expect, it } from "vitest";
import { webMcpTool } from "../components/webmcp/web-mcp-tool";
import { Client } from "../core/client";
import { BrowserPlatform } from "./browser-platform";

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Platform WebMCP tools", () => {
  it("сохраняет список, шлёт метаданные без execute и отвечает на вызов", async () => {
    const client = new Client();
    const platform = new BrowserPlatform(client);
    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));
    let calls = 0;
    const tool = webMcpTool({
      name: "get_location",
      description: "Координаты",
      execute: async () => {
        calls += 1;
        return "55,37";
      },
    });

    const done = firstValueFrom(platform.setTools([tool]));
    const sent = outgoing.find(
      (message): message is PlatformSetToolsMessage =>
        message instanceof PlatformSetToolsMessage,
    );

    expect(platform.getTools()).toEqual([tool]);
    expect(sent?.payload.tools).toEqual([
      {
        id: tool.id,
        name: "get_location",
        description: "Координаты",
        annotations: [],
      },
    ]);
    expect(JSON.stringify(sent?.payload)).not.toContain("execute");
    if (!sent) {
      return;
    }
    client.incomingMessage$.next(new ActionCompletedMessage(sent.target));
    await done;

    const call = new WebMcpToolCallMessage(tool.id);
    client.incomingMessage$.next(call);
    await flushMicrotasks();

    expect(calls).toBe(1);
    const result = outgoing.find(
      (message): message is WebMcpToolResultMessage =>
        message instanceof WebMcpToolResultMessage,
    );
    expect(result?.target).toBe(tool.id);
    expect(result?.payload).toEqual({ result: "55,37", callId: call.id });
  });

  it("повторный setTools забывает старый id, пустой список очищает", async () => {
    const client = new Client();
    const platform = new BrowserPlatform(client);
    const outgoing: BffToClientMessage[] = [];
    client.outcomingMessage$.subscribe((message) => outgoing.push(message));
    let firstCalls = 0;
    const first = webMcpTool({
      name: "first",
      description: "Первый",
      execute: async () => {
        firstCalls += 1;
        return "first";
      },
    });
    const second = webMcpTool({
      name: "second",
      description: "Второй",
      execute: async () => "second",
    });

    const firstDone = firstValueFrom(platform.setTools([first]));
    const firstSent = outgoing.find(
      (message): message is PlatformSetToolsMessage =>
        message instanceof PlatformSetToolsMessage,
    );
    if (!firstSent) {
      throw new Error("setTools did not send a message");
    }
    client.incomingMessage$.next(new ActionCompletedMessage(firstSent.target));
    await firstDone;

    outgoing.length = 0;
    const secondDone = firstValueFrom(platform.setTools([second]));
    expect(platform.getTools().map((tool) => tool.id)).toEqual([second.id]);
    const secondSent = outgoing.find(
      (message): message is PlatformSetToolsMessage =>
        message instanceof PlatformSetToolsMessage,
    );
    if (!secondSent) {
      throw new Error("setTools did not send a message");
    }
    client.incomingMessage$.next(new ActionCompletedMessage(secondSent.target));
    await secondDone;

    client.incomingMessage$.next(new WebMcpToolCallMessage(first.id));
    await flushMicrotasks();
    expect(firstCalls).toBe(0);
    expect(
      outgoing.some((message) => message instanceof WebMcpToolResultMessage),
    ).toBe(false);

    outgoing.length = 0;
    const clearDone = firstValueFrom(platform.setTools([]));
    const clearSent = outgoing.find(
      (message): message is PlatformSetToolsMessage =>
        message instanceof PlatformSetToolsMessage,
    );
    expect(platform.getTools()).toEqual([]);
    expect(clearSent?.payload.tools).toEqual([]);
    if (!clearSent) {
      return;
    }
    client.incomingMessage$.next(new ActionCompletedMessage(clearSent.target));
    await clearDone;
  });
});
