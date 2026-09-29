import { describe, expect, it } from "vitest";
import { Client, runWithClient } from "../core";
import {
  animate,
  ComponentAnimationEffect,
} from "../core/actions/animate-component";
import { dialog } from "./dialog";

function createClient(): Client {
  return new Client();
}

describe("Dialog backdrop", () => {
  it("сериализует backdrop.onEnter и backdrop.onLeave", () => {
    const client = createClient();
    const dlg = dialog({
      backdrop: {
        onEnter: animate({
          duration: 200,
          effects: {
            [ComponentAnimationEffect.Opacity]: {
              0: 0,
              100: 1,
            },
          },
        }),
        onLeave: animate({
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
});
