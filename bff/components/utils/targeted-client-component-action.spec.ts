import { DialogCloseMessage } from "@matreshka/shared/messages/bff-to-client/components/dialog/dialog-close-message";
import { ActionCompletedMessage } from "@matreshka/shared/messages/client-to-bff/action-completed-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { describe, expect, it } from "vitest";
import { Client } from "../../core";
import { targetedClientComponentAction } from "./targeted-client-component-action";

describe("targetedClientComponentAction", () => {
  it("завершается ActionCompletedMessage с тем же scope", async () => {
    const client = new Client();
    client.outcomingMessage$.subscribe((outgoing) => {
      if (outgoing instanceof DialogCloseMessage) {
        queueMicrotask(() => {
          client.incomingMessage$.next(
            new ActionCompletedMessage(outgoing.actionScope),
          );
        });
      }
    });
    await new Promise<void>((resolve, reject) => {
      targetedClientComponentAction(
        client,
        (actionScope) => new DialogCloseMessage("dialog-1", { actionScope }),
      ).subscribe({
        next: () => resolve(),
        error: reject,
      });
    });
  });

  it("завершается ошибкой по ErrorMessage", async () => {
    const client = new Client();
    client.outcomingMessage$.subscribe((outgoing) => {
      if (outgoing instanceof DialogCloseMessage) {
        queueMicrotask(() => {
          client.incomingMessage$.next(
            new ErrorMessage(outgoing.actionScope, { message: "fail" }),
          );
        });
      }
    });
    const error = await new Promise<Error>((resolve) => {
      targetedClientComponentAction(
        client,
        (actionScope) => new DialogCloseMessage("dialog-1", { actionScope }),
      ).subscribe({
        error: (err) => resolve(err as Error),
      });
    });
    expect(error.message).toBe("fail");
  });
});
