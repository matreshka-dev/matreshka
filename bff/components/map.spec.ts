import { describe, expect, it } from "vitest";
import { Client, Context, runWithClient } from "../core";
import { itemList, map } from "./map";
import { text } from "./outputs/text";

function createClient(): Client {
  return new Client();
}

describe("Map itemList", () => {
  it("сериализует hybrid markers с itemList", async () => {
    const client = createClient();
    const staticMarker = text("HQ");
    const context = new Context<{
      points: { id: string; lat: number; lng: number }[];
    }>({
      data: async () => ({
        points: [{ id: "p1", lat: 10, lng: 20 }],
      }),
    });
    await context.init();
    const instance = map({
      apiKey: "key",
      center: { latitude: 0, longitude: 0 },
      markers: [
        {
          coordinates: { latitude: 0, longitude: 0 },
          width: 50,
          component: staticMarker,
        },
        itemList({
          ref: context.ref("points"),
          track: (point) => point.id,
          preload: true,
          generator: ({ ref }) => {
            const point = ref.value();
            return {
              coordinates: { latitude: point.lat, longitude: point.lng },
              width: 80,
              component: text(`P:${point.id}`),
            };
          },
        }),
      ],
    });
    const config = runWithClient(client, () => instance.serialize());
    expect(config.properties.markers).toHaveLength(2);
    expect(config.properties.markers?.[0].id).toBe(staticMarker.id);
    expect(config.properties.markers?.[1].id).toBe("p1");
  });
});
