import { describe, expect, it } from "vitest";
import { Client, runWithClient } from "../core";
import { PopoverPositionArea } from "./enum/popover-position-area";
import { text } from "./outputs/text";
import { Popover, popover } from "./popover";

function createClient(): Client {
  return new Client();
}

describe("Popover", () => {
  it("сериализует positionArea и size из конфигурации", () => {
    const client = createClient();
    const panel = popover(
      {
        positionArea: PopoverPositionArea.BottomCenter,
        size: 1,
      },
      [text("Меню")],
    );

    const config = runWithClient(client, () => panel.serialize());

    expect(config.properties?.positionArea).toBe(
      PopoverPositionArea.BottomCenter,
    );
    expect(config.properties?.size).toBe(1);
    expect(config.properties?.content).toHaveLength(1);
  });

  it("берёт содержимое и позицию из методов и видит поле наследника", () => {
    const client = createClient();

    class MethodPopover extends Popover {
      constructor(private readonly label: string) {
        super({ size: 2 });
      }

      protected override content() {
        return [text(this.label)];
      }

      protected override positionArea() {
        return PopoverPositionArea.TopCenter;
      }
    }

    const panel = new MethodPopover("Пункт");
    const config = runWithClient(client, () => panel.serialize());

    expect(config.properties?.content?.[0]?.properties).toMatchObject({
      value: "Пункт",
    });
    expect(config.properties?.positionArea).toBe(PopoverPositionArea.TopCenter);
    expect(config.properties?.size).toBe(2);
  });
});
