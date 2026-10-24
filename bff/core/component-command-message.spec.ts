import { AppBackMessage } from "@matreshka/shared/messages/bff-to-client/app/app-back-message";
import { isComponentCommandMessage } from "@matreshka/shared/messages/bff-to-client/component-command-message";
import { bffToClientMessageRegistry } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message-registry";
import { DialogCloseMessage } from "@matreshka/shared/messages/bff-to-client/components/dialog/dialog-close-message";
import { parseBffToClientMessage } from "@matreshka/shared/messages/bff-to-client/parse-bff-to-client-message";
import { registerBffToClientMessages } from "@matreshka/shared/messages/bff-to-client/register-messages";
import { ForEachSyncComponentsMessage } from "@matreshka/shared/messages/bff-to-client/components/for-each/for-each-sync-components-message";
import { PingableComponentCommandMessage } from "@matreshka/shared/messages/bff-to-client/pingable-component-command-message";
import { ReliableComponentCommandMessage } from "@matreshka/shared/messages/bff-to-client/reliable-component-command-message";
import {
  isPingableMessage,
  isReliableMessage,
} from "@matreshka/shared/messages/reliable-delivery";
import { beforeAll, describe, expect, it } from "vitest";

describe("Component command messages", () => {
  beforeAll(() => {
    if (!bffToClientMessageRegistry.findByType(DialogCloseMessage.type)) {
      registerBffToClientMessages();
    }
  });

  it("лёгкие команды компоненту pingable и проходят isComponentCommandMessage", () => {
    const message = new DialogCloseMessage("dialog-1", {
      actionScope: "component-action-test",
    });

    expect(message).toBeInstanceOf(PingableComponentCommandMessage);
    expect(isComponentCommandMessage(message)).toBe(true);
    expect(isReliableMessage(message)).toBe(true);
    expect(isPingableMessage(message)).toBe(true);
  });

  it("после parse wire payload actionScope остаётся строкой", () => {
    const outgoing = new DialogCloseMessage("dialog-1", {
      actionScope: "component-action-test",
    });
    const parsed = parseBffToClientMessage(outgoing.toJSON());

    expect(parsed).toBeInstanceOf(DialogCloseMessage);
    expect(parsed.actionScope).toBe("component-action-test");
  });

  it("ForEachSync reliable, но не pingable", () => {
    const message = new ForEachSyncComponentsMessage("for-each-1", []);

    expect(message).toBeInstanceOf(ReliableComponentCommandMessage);
    expect(message).not.toBeInstanceOf(PingableComponentCommandMessage);
    expect(isComponentCommandMessage(message)).toBe(true);
    expect(isReliableMessage(message)).toBe(true);
    expect(isPingableMessage(message)).toBe(false);
  });

  it("не считает обычные app-сообщения командами компоненту", () => {
    expect(isComponentCommandMessage(new AppBackMessage())).toBe(false);
  });
});
