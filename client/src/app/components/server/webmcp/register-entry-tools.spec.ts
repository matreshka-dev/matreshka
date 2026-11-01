import { ConditionType } from '@shared/enums/condition-type';
import { WebMcpToolAnnotation } from '@shared/enums/web-mcp-tool-annotation';
import { WebMcpToolErrorMessage } from '@shared/messages/bff-to-client/webmcp/web-mcp-tool-error-message';
import { WebMcpToolResultMessage } from '@shared/messages/bff-to-client/webmcp/web-mcp-tool-result-message';
import { WebMcpToolCallMessage } from '@shared/messages/client-to-bff/webmcp/web-mcp-tool-call-message';
import type { Condition } from '@shared/types/condition';
import type { WebMcpToolConfig } from '@shared/types/web-mcp-tool-config';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import type { ContextChangeEvent } from '../../../types/context-change-event';
import { registerEntryWebMcpTools } from './register-entry-tools';

const tool: WebMcpToolConfig = {
  id: 'tool-1',
  name: 'get_order_status',
  description: 'Статус заказа',
  annotations: [WebMcpToolAnnotation.ReadOnlyHint],
};

type RegisteredClientTool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
    consequentialHint: boolean;
    debugging: boolean;
  };
  execute: (input?: unknown) => Promise<string>;
};

type RegisterTool = (
  tool: RegisteredClientTool,
  options?: { signal?: AbortSignal },
) => Promise<void>;

function documentWith(registerTool: RegisterTool): Document {
  return { modelContext: { registerTool } } as unknown as Document;
}

describe('registerEntryWebMcpTools', () => {
  it('регистрирует тулз и снимает его через abort', async () => {
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    const unregister = registerEntryWebMcpTools(
      documentWith(registerTool),
      [tool],
      postman,
    );

    expect(registerTool).toHaveBeenCalledTimes(1);
    const registration = registerTool.mock.calls[0];
    expect(registration?.[1]?.signal?.aborted).toBe(false);
    const registered = registration?.[0];
    if (!registered) {
      throw new Error('tool was not registered');
    }
    expect(registered.name).toBe('get_order_status');
    expect(registered.description).toBe('Статус заказа');
    expect(registered.inputSchema).toEqual({ type: 'object', properties: {} });
    expect(registered.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: false,
      consequentialHint: false,
      debugging: false,
    });

    const outgoing: WebMcpToolCallMessage[] = [];
    postman.outcomingMessage$.subscribe((message) => {
      if (message instanceof WebMcpToolCallMessage) {
        outgoing.push(message);
      }
    });
    const pending = registered.execute();
    const call = outgoing[0];
    if (!call) {
      throw new Error('web-mcp-tool-call was not sent');
    }
    expect(call.target).toBe('tool-1');
    postman.incomingMessage$.next(
      new WebMcpToolResultMessage(call.target, {
        result: 'pending',
        callId: call.id,
      }),
    );
    await expect(pending).resolves.toBe('pending');

    unregister();
    expect(registration?.[1]?.signal?.aborted).toBe(true);
  });

  it('отклоняет execute текстом ошибки', async () => {
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    const unregister = registerEntryWebMcpTools(
      documentWith(registerTool),
      [tool],
      postman,
    );
    const registered = registerTool.mock.calls[0][0];
    const outgoing: WebMcpToolCallMessage[] = [];
    postman.outcomingMessage$.subscribe((message) => {
      if (message instanceof WebMcpToolCallMessage) {
        outgoing.push(message);
      }
    });

    const pending = registered.execute();
    const call = outgoing[0];
    if (!call) {
      throw new Error('web-mcp-tool-call was not sent');
    }
    postman.incomingMessage$.next(
      new WebMcpToolErrorMessage(call.target, {
        message: 'boom',
        callId: call.id,
      }),
    );
    await expect(pending).rejects.toThrow('boom');
    unregister();
  });

  it('передаёт JSON Schema и аргументы вызова', async () => {
    const inputSchema = {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    };
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    const unregister = registerEntryWebMcpTools(
      documentWith(registerTool),
      [{ ...tool, inputSchema }],
      postman,
    );

    const registered = registerTool.mock.calls[0]?.[0];
    expect(registered?.inputSchema).toEqual(inputSchema);
    const outgoing: WebMcpToolCallMessage[] = [];
    postman.outcomingMessage$.subscribe((message) => {
      if (message instanceof WebMcpToolCallMessage) {
        outgoing.push(message);
      }
    });
    const pending = registered?.execute({ text: 'Купить молоко' });
    expect(outgoing[0]?.payload).toEqual({ input: { text: 'Купить молоко' } });
    postman.incomingMessage$.next(
      new WebMcpToolResultMessage('tool-1', {
        result: 'Купить молоко',
        callId: outgoing[0].id,
      }),
    );
    await expect(pending).resolves.toBe('Купить молоко');
    unregister();
  });

  it('не регистрирует тулзы без modelContext и глотает отказ registerTool', async () => {
    const postman = new TestPostmanService();
    expect(() =>
      registerEntryWebMcpTools(document, [tool], postman),
    ).not.toThrow();

    const registerTool = vi
      .fn<RegisterTool>()
      .mockRejectedValue(new Error('duplicate'));
    const unregister = registerEntryWebMcpTools(
      documentWith(registerTool),
      [tool],
      postman,
    );
    unregister();
    await Promise.resolve();
  });

  it('регистрирует тулз только пока выполнены conditions', () => {
    const conditions: Condition[] = [
      {
        type: ConditionType.ContextValueEqual,
        payload: {
          ref: 'ctx.mode',
          value: { kind: 'literal', value: 'edit' },
        },
      },
    ];
    let met = false;
    const contextChange$ = new Subject<ContextChangeEvent>();
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    const unregister = registerEntryWebMcpTools(
      documentWith(registerTool),
      [{ ...tool, conditions }],
      postman,
      {
        conditionsMet: () => met,
        contextChange$,
      },
    );

    expect(registerTool).not.toHaveBeenCalled();

    contextChange$.next({
      contextId: 'other',
      values: [{ key: 'mode', value: 'edit' }],
    });
    expect(registerTool).not.toHaveBeenCalled();

    met = true;
    contextChange$.next({
      contextId: 'ctx',
      values: [{ key: 'mode', value: 'edit' }],
    });
    expect(registerTool).toHaveBeenCalledTimes(1);
    const signal = registerTool.mock.calls[0]?.[1]?.signal;
    expect(signal?.aborted).toBe(false);

    met = false;
    contextChange$.next({
      contextId: 'ctx',
      values: [{ key: 'mode', value: 'view' }],
    });
    expect(signal?.aborted).toBe(true);

    unregister();
  });

  it('добавляет суффикс к занятому имени и освобождает его после снятия', () => {
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    const first = registerEntryWebMcpTools(
      documentWith(registerTool),
      [{ ...tool, id: 'save-a', name: 'save' }],
      postman,
    );
    const second = registerEntryWebMcpTools(
      documentWith(registerTool),
      [{ ...tool, id: 'save-b', name: 'save' }],
      postman,
    );

    expect(registerTool.mock.calls.map((call) => call[0].name)).toEqual([
      'save',
      'save_2',
    ]);

    first();
    const third = registerEntryWebMcpTools(
      documentWith(registerTool),
      [{ ...tool, id: 'save-c', name: 'save' }],
      postman,
    );
    expect(registerTool.mock.calls.at(-1)?.[0].name).toBe('save');

    second();
    third();
  });
});
