import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { OverlayAnchor } from "@matreshka/shared/types/container-overlay";
import { describe, expect, it } from "vitest";
import { Client, runWithClient } from "../core";
import { stack, text } from "./index";

describe("overlays на любом компоненте", () => {
  it("сериализует overlays у stack без пустого ключа", () => {
    const client = new Client();
    const badge = text({ value: "!" });
    const s = stack({
      content: [],
      overlays: [
        { anchors: [OverlayAnchor.Top, OverlayAnchor.End], component: badge },
      ],
    });
    const config = runWithClient(client, () => s.serialize());
    expect(config.properties?.overlays).toHaveLength(1);
    expect(config.properties?.overlays?.[0].component.class).toBe(
      ServerComponentClass.Text,
    );
  });

  it("не включает overlays в JSON, если не заданы", () => {
    const client = new Client();
    const t = text({ value: "x" });
    const config = runWithClient(client, () => t.serialize());
    const wire = JSON.parse(JSON.stringify(config));
    expect("overlays" in (wire.properties ?? {})).toBe(false);
  });
});
