import { NestedItemsSyncMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/components/nested-items/nested-items-sync-message";
import { ComponentShowMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/components/component-show-message";
import { registerCommonClientToBffMessages } from "@matreshka/client-bff-protocol/messages/client-to-bff/register-common-messages";
import { diffNestedItems } from "@matreshka/shared/utils/diff-nested-items";
import { beforeAll, describe, expect, it } from "vitest";
import { Client, createContext, runWithClient } from "../../core";
import { Component } from "../component";
import { itemList, map, type MapMarker, type MapMarkerEntry } from "../map";
import { text } from "../outputs/text";
import { isItemList } from "./flatten-nested-items";

function createClient(): Client {
  return new Client();
}

describe("flattenNestedItems", () => {
  it("разворачивает только static entries", () => {
    const client = createClient();
    const marker = text("A");
    const source: MapMarker[] = [
      {
        coordinates: { latitude: 1, longitude: 2 },
        width: 100,
        component: marker,
      },
    ];
    const mapInstance = map({
      apiKey: "key",
      center: { latitude: 0, longitude: 0 },
      markers: source,
    });
    const config = runWithClient(client, () => mapInstance.serialize());

    expect(config.properties.markers).toHaveLength(1);
    expect(config.properties.markers?.[0].id).toBe(marker.id);
    expect(config.properties.markers?.[0].component.class).toBe("text");
  });

  it("сохраняет порядок static + itemList + static", async () => {
    const client = createClient();
    const staticA = text("A");
    const staticB = text("B");
    const context = createContext({
      data: async () => ({
        points: [{ id: "p1", lat: 10, lng: 20 }],
      }),
    });
    await context.init();
    const dynamicList = itemList({
      ref: context.ref("points"),
      track: (point) => point.id,
      preload: true,
      generator: ({ ref }) => {
        const point = ref.get();
        return {
          coordinates: { latitude: point.lat, longitude: point.lng },
          width: 80,
          component: text(`P:${point.id}`),
        };
      },
    });
    const source: MapMarkerEntry[] = [
      {
        coordinates: { latitude: 0, longitude: 0 },
        width: 50,
        component: staticA,
      },
      dynamicList as MapMarkerEntry,
      {
        coordinates: { latitude: 1, longitude: 1 },
        width: 50,
        component: staticB,
      },
    ];
    const mapInstance = map({
      apiKey: "key",
      center: { latitude: 0, longitude: 0 },
      markers: source,
    });
    const config = runWithClient(client, () => mapInstance.serialize());
    expect(config.properties.markers).toHaveLength(3);
    expect(config.properties.markers?.[0].id).toBe(staticA.id);
    expect(config.properties.markers?.[1].id).toBe("p1");
    expect(config.properties.markers?.[2].id).toBe(staticB.id);
  });
});

describe("itemList", () => {
  it("передаёт в text ссылку на поле элемента, а не значение", async () => {
    const context = createContext({
      data: async () => ({ departments: [{ id: 1, name: "A" }] }),
    });
    await context.init();

    const list = itemList({
      ref: context.ref("departments"),
      track: (department) => String(department.id),
      generator: ({ ref: departmentRef }) => ({
        position: { x: 0, y: 0 },
        component: text({ maxLines: 1 }, departmentRef.ref("name")),
      }),
    });

    expect(isItemList(list)).toBe(true);
  });

  it("isItemList распознаёт фабрику", () => {
    const context = createContext<{ items: string[] }>({
      data: async () => ({ items: [] }),
    });
    const list = itemList({
      ref: context.ref("items"),
      track: (item) => item,
      generator: () => ({
        position: { x: 0, y: 0 },
        component: text("x"),
      }),
    });
    expect(isItemList(list)).toBe(true);
  });
});

describe("diffNestedItems", () => {
  it("различает added, removed, updated, unchanged", () => {
    const prev = [
      { id: "a", component: { id: "c-a", class: "text" } as any },
      { id: "b", component: { id: "c-b", class: "text" } as any },
    ];
    const next = [
      { id: "a", component: { id: "c-a", class: "text" } as any },
      { id: "c", component: { id: "c-c", class: "text" } as any },
      {
        id: "b",
        component: {
          id: "c-b",
          class: "text",
          properties: { value: "2" },
        } as any,
      },
    ];
    const diff = diffNestedItems(prev, next);
    expect(diff.unchanged.map((x) => x.id)).toEqual(["a"]);
    expect(diff.added.map((x) => x.id)).toEqual(["c"]);
    expect(diff.removed).toEqual([]);
    expect(diff.updated.map((x) => x.id)).toEqual(["b"]);
  });
});

describe("itemList sync", () => {
  beforeAll(() => {
    registerCommonClientToBffMessages();
  });

  it("шлёт конфиги только новых ключей и не раздувает полную замену старыми элементами", async () => {
    const client = createClient();
    const context = createContext({
      data: async () => ({
        points: [{ id: "p1", lat: 1, lng: 2 }],
      }),
    });
    await context.init();
    const staticMarker = text("static");
    const dynamic = itemList({
      ref: context.ref("points"),
      track: (point) => point.id,
      preload: true,
      generator: ({ ref }) => {
        const point = ref.get();
        return {
          coordinates: { latitude: point.lat, longitude: point.lng },
          width: 10,
          component: text(point.id),
        };
      },
    });
    const mapInstance = map({
      apiKey: "key",
      center: { latitude: 0, longitude: 0 },
      markers: [
        {
          coordinates: { latitude: 0, longitude: 0 },
          width: 10,
          component: staticMarker,
        },
        dynamic as MapMarkerEntry,
      ],
    });
    const config = runWithClient(client, () => mapInstance.serialize());
    const messages: NestedItemsSyncMessage[] = [];
    client.outcomingMessage$.subscribe((message) => {
      if (message instanceof NestedItemsSyncMessage) {
        messages.push(message);
      }
    });
    client.newMessage(
      JSON.stringify({
        type: ComponentShowMessage.type,
        target: config.id,
        handlers: [0],
      }),
    );
    expect(messages).toHaveLength(0);
    expect((staticMarker as Component).getInstances({ client })).toHaveLength(
      1,
    );

    context.replace({
      points: [
        { id: "p1", lat: 1, lng: 2 },
        { id: "p2", lat: 3, lng: 4 },
      ],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.order).toEqual([staticMarker.id, "p1", "p2"]);
    expect(messages[0].payload.upserts.map((item) => item.id)).toEqual(["p2"]);
    expect((staticMarker as Component).getInstances({ client })).toHaveLength(
      1,
    );

    messages.length = 0;
    context.replace({
      points: [{ id: "p3", lat: 5, lng: 6 }],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.order).toEqual([staticMarker.id, "p3"]);
    expect(messages[0].payload.upserts.map((item) => item.id)).toEqual(["p3"]);

    messages.length = 0;
    context.replace({
      points: [
        { id: "n1", lat: 0, lng: 0 },
        { id: "n2", lat: 1, lng: 1 },
      ],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.order).toEqual([staticMarker.id, "n1", "n2"]);
    expect(messages[0].payload.upserts.map((item) => item.id)).toEqual([
      "n1",
      "n2",
    ]);
  });
});

describe("Map", () => {
  it("сериализует static markers с id", () => {
    const client = createClient();
    const markerComponent = text("Office");
    const instance = map({
      apiKey: "key",
      center: { latitude: 55.75, longitude: 37.62 },
      markers: [
        {
          coordinates: { latitude: 55.75, longitude: 37.62 },
          width: 120,
          component: markerComponent,
        },
      ],
    });
    const config = runWithClient(client, () => instance.serialize());
    expect(config.properties.markers).toHaveLength(1);
    expect(config.properties.markers?.[0].id).toBe(markerComponent.id);
  });
});
