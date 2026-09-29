import { ContextInitMessage } from "@matreshka/shared/messages/bff-to-client/context/context-init-message";
import { describe, expect, it } from "vitest";
import { Client, Context, runWithClient } from "../core";
import { board, itemList } from "./board";
import { text } from "./outputs/text";

function createClient(): Client {
  return new Client();
}

describe("Board", () => {
  it("сериализует items с вложенным component", () => {
    const client = createClient();
    const card = text("Отдел продаж");
    const instance = board({
      center: { x: 10, y: 20 },
      zoom: 1.5,
      minZoom: 0.5,
      maxZoom: 3,
      zoomStep: 0.2,
      items: [
        {
          position: { x: 120, y: 40 },
          component: card,
        },
      ],
    });

    const config = runWithClient(client, () => instance.serialize());

    expect(config.class).toBe("board");
    expect(config.properties.center).toEqual({ x: 10, y: 20 });
    expect(config.properties.zoom).toBe(1.5);
    expect(config.properties.minZoom).toBe(0.5);
    expect(config.properties.maxZoom).toBe(3);
    expect(config.properties.zoomStep).toBe(0.2);
    expect(config.properties.items).toHaveLength(1);
    expect(config.properties.items?.[0].id).toBe(card.id);
    expect(config.properties.items?.[0].position).toEqual({ x: 120, y: 40 });
    expect(config.properties.items?.[0].component.class).toBe("text");
    expect(config.properties.items?.[0].component.id).toBeDefined();
  });

  it("подставляет значения zoom по умолчанию", () => {
    const client = createClient();
    const instance = board({
      items: [],
    });

    const config = runWithClient(client, () => instance.serialize());

    expect(config.properties.center).toEqual({ x: 0, y: 0 });
    expect(config.properties.zoom).toBe(1);
    expect(config.properties.minZoom).toBe(0.25);
    expect(config.properties.maxZoom).toBe(4);
    expect(config.properties.zoomStep).toBe(0.3);
    expect(config.properties.items).toEqual([]);
  });

  it("сериализует itemList в items", async () => {
    const client = createClient();
    const context = new Context<{
      cards: { id: string; x: number; y: number; title: string }[];
    }>({
      data: async () => ({
        cards: [{ id: "c1", x: 5, y: 10, title: "Sales" }],
      }),
    });
    await context.init();
    const instance = board({
      items: [
        itemList({
          ref: context.ref("cards"),
          track: (card) => card.id,
          preload: true,
          generator: ({ ref }) => {
            const card = ref.value();
            return {
              position: { x: card.x, y: card.y },
              component: text(card.title),
            };
          },
        }),
      ],
    });
    const config = runWithClient(client, () => instance.serialize());
    expect(config.properties.items).toHaveLength(1);
    expect(config.properties.items?.[0].id).toBe("c1");
    expect(config.properties.items?.[0].position).toEqual({ x: 5, y: 10 });
  });

  it("сериализует itemList с ref на поле элемента и отдаёт index context клиенту", async () => {
    const client = createClient();
    const context = new Context<{
      cards: { id: string; x: number; y: number; title: string }[];
    }>({
      preload: true,
      data: async () => ({
        cards: [{ id: "c1", x: 5, y: 10, title: "Sales" }],
      }),
    });
    await context.init();
    const instance = board({
      items: [
        itemList({
          ref: context.ref("cards"),
          track: (card) => card.id,
          preload: true,
          generator: ({ ref: cardRef }) => ({
            position: { x: cardRef.value().x, y: cardRef.value().y },
            component: text(cardRef.ref("title")),
          }),
        }),
      ],
    });

    const indexContextInitPromise = new Promise<ContextInitMessage>(
      (resolve) => {
        client.outcomingMessage$.subscribe((message) => {
          if (
            message instanceof ContextInitMessage &&
            message.target !== context.id &&
            "idc1" in message.payload
          ) {
            resolve(message);
          }
        });
      },
    );

    const config = runWithClient(client, () => instance.serialize());
    const titleRefProp =
      config.properties.items?.[0]?.component.properties?.ref;

    expect(titleRefProp).toBeDefined();
    expect((titleRefProp as { path: string }).path).toContain("cards");
    expect((titleRefProp as { path: string }).path).toContain("title");

    const indexContextInit = await indexContextInitPromise;
    expect((indexContextInit.payload.idc1 as { index?: string })?.index).toBe(
      "0",
    );
  });
});
