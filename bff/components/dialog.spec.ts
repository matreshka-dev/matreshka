import { ColorRole } from "@matreshka/shared/enums/color-role";
import { OverlayAnchor } from "@matreshka/shared/types/container-overlay";
import { describe, expect, it } from "vitest";
import {
  Client,
  ComponentAnimationEffect,
  local,
  runWithClient,
} from "../core";
import { colorTokenId } from "../core/utils/color-token-id";
import { Dialog, dialog } from "./dialog";
import { text } from "./outputs/text";
import { WebMcpToolAnnotation, webMcpTool } from "./webmcp/web-mcp-tool";

function createClient(): Client {
  return new Client();
}

describe("Dialog backdrop", () => {
  it("сериализует backdrop.onEnter и backdrop.onLeave", () => {
    const client = createClient();
    const dlg = dialog({
      backdrop: {
        onEnter: local.animate({
          duration: 200,
          effects: {
            [ComponentAnimationEffect.Opacity]: {
              0: 0,
              100: 1,
            },
          },
        }),
        onLeave: local.animate({
          duration: 150,
          effects: {
            [ComponentAnimationEffect.Opacity]: {
              100: 0,
            },
          },
        }),
      },
      content: [],
    });

    const config = runWithClient(client, () => dlg.serialize());

    expect(config.properties?.backdrop?.onEnter).toEqual([
      {
        class: "animate-component",
        payload: {
          duration: 200,
          effects: {
            opacity: {
              0: 0,
              100: 1,
            },
          },
        },
      },
    ]);
    expect(config.properties?.backdrop?.onLeave).toEqual([
      {
        class: "animate-component",
        payload: {
          duration: 150,
          effects: {
            opacity: {
              100: 0,
            },
          },
        },
      },
    ]);
  });

  it("сериализует onEnter из конфигурации один раз", () => {
    const client = createClient();
    const dlg = dialog({
      content: [],
      onEnter: local.animate({
        duration: 200,
        effects: {
          [ComponentAnimationEffect.Opacity]: {
            0: 0,
            100: 1,
          },
        },
      }),
    });

    const config = runWithClient(client, () => dlg.serialize());

    expect(config.interactions?.enter).toHaveLength(1);
    expect(config.interactions?.enter?.[0]?.payload).toMatchObject({
      duration: 200,
    });
  });
});

describe("Dialog methods", () => {
  it("берёт content, anchors, modal, цвета и подложку из методов", () => {
    const client = createClient();
    const backdrop = { default: "#111111" };
    const textColor = { default: "#222222" };

    class MethodDialog extends Dialog {
      constructor(private readonly label: string) {
        super();
      }

      protected override content() {
        return [text(this.label)];
      }

      protected override anchors() {
        return [OverlayAnchor.Bottom];
      }

      protected override modal() {
        return false;
      }

      protected override colors() {
        return {
          [ColorRole.Backdrop]: backdrop,
          [ColorRole.Text]: textColor,
        };
      }

      protected override backdrop() {
        return {
          onEnter: local.animate({
            duration: 10,
            effects: {
              [ComponentAnimationEffect.Opacity]: {
                0: 0,
                100: 1,
              },
            },
          }),
          ...super.backdrop(),
        };
      }
    }

    const dlg = new MethodDialog("Привет");
    const config = runWithClient(client, () => dlg.serialize());

    expect(config.properties?.content?.[0]?.properties).toMatchObject({
      value: "Привет",
    });
    expect(config.properties?.anchors).toEqual([OverlayAnchor.Bottom]);
    expect(config.properties?.modal).toBe(false);
    expect(config.properties?.colors?.[ColorRole.Backdrop]).toBe(
      colorTokenId(backdrop),
    );
    expect(config.properties?.colors?.[ColorRole.Text]).toBe(
      colorTokenId(textColor),
    );
    expect(config.properties?.backdrop?.onEnter?.[0]?.payload).toMatchObject({
      duration: 10,
    });
  });

  it("метод заменяет onEnter конструктора, super.backdrop читает конструктор", () => {
    const client = createClient();

    class MergedDialog extends Dialog {
      protected override onEnter() {
        return local.animate({
          duration: 10,
          effects: {
            [ComponentAnimationEffect.Opacity]: {
              0: 0,
              100: 1,
            },
          },
        });
      }

      protected override backdrop() {
        return {
          onEnter: local.animate({
            duration: 10,
            effects: {
              [ComponentAnimationEffect.Opacity]: {
                0: 0,
                100: 1,
              },
            },
          }),
          onLeave: local.animate({
            duration: 11,
            effects: {
              [ComponentAnimationEffect.Opacity]: {
                100: 0,
              },
            },
          }),
          ...super.backdrop(),
        };
      }
    }

    const dlg = new MergedDialog({
      content: [],
      modal: true,
      onEnter: local.animate({
        duration: 999,
        effects: {
          [ComponentAnimationEffect.Opacity]: {
            0: 0,
            100: 1,
          },
        },
      }),
      backdrop: {
        onLeave: local.animate({
          duration: 50,
          effects: {
            [ComponentAnimationEffect.Opacity]: {
              100: 0,
            },
          },
        }),
      },
      colors: {
        [ColorRole.Text]: { default: "#333333" },
      },
    });

    const config = runWithClient(client, () => dlg.serialize());

    expect(config.properties?.modal).toBe(true);
    expect(config.interactions?.enter).toHaveLength(1);
    expect(config.interactions?.enter?.[0]?.payload).toMatchObject({
      duration: 10,
    });
    expect(config.properties?.backdrop?.onEnter?.[0]?.payload).toMatchObject({
      duration: 10,
    });
    expect(config.properties?.backdrop?.onLeave?.[0]?.payload).toMatchObject({
      duration: 50,
    });
    expect(config.properties?.colors?.[ColorRole.Text]).toBe(
      colorTokenId({ default: "#333333" }),
    );
  });

  it("регистрирует tools() после конструктора", () => {
    class ToolsDialog extends Dialog {
      constructor(private readonly toolName: string) {
        super();
      }

      protected override content() {
        return [];
      }

      protected override tools() {
        return [
          webMcpTool({
            name: this.toolName,
            description: "Подтверждает действие",
            annotations: [WebMcpToolAnnotation.ReadOnlyHint],
            execute: async () => "ok",
          }),
        ];
      }
    }

    const dlg = new ToolsDialog("confirm");

    expect(dlg.entryTools).toHaveLength(1);
    expect(dlg.entryTools[0]?.name).toBe("confirm");
  });
});
