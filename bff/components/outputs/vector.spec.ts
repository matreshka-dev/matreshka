import { RatioMode } from "@matreshka/shared/enums/ratio-mode";
import { VectorMode } from "@matreshka/shared/enums/vector-mode";
import { describe, expect, it } from "vitest";
import { Client, runWithClient } from "../../core";
import { vector } from "./vector";

function createClient(): Client {
  return new Client();
}

describe("vector", () => {
  it("сериализует properties с default mode Native", () => {
    const client = createClient();
    const instance = vector("<svg></svg>");

    const config = runWithClient(client, () => instance.serialize());

    expect(config.class).toBe("vector");
    expect(config.properties!.mode).toBe(VectorMode.Native);
    expect(config.properties!.value).toBe("<svg></svg>");
  });

  it("сериализует mask mode, flexItem и ratio", () => {
    const client = createClient();
    const instance = vector(
      {
        mode: VectorMode.Mask,
        flexItem: { basis: 200, grow: 0, shrink: 0 },
        ratio: { value: 2, mode: RatioMode.Fit },
      },
      "<svg></svg>",
    );

    const config = runWithClient(client, () => instance.serialize());

    expect(config.properties!.mode).toBe(VectorMode.Mask);
    expect(config.properties!.flexItem).toEqual({
      basis: { unit: "px", value: 200 },
      grow: 0,
      shrink: 0,
    });
    expect(config.properties!.ratio).toEqual({
      value: 2,
      mode: RatioMode.Fit,
    });
  });
});
