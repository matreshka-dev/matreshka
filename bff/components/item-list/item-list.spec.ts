import { diffNestedItems } from "@matreshka/shared/utils/diff-nested-items";
import { describe, expect, it } from "vitest";
import { Client, Context, runWithClient } from "../../core";
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
    const context = new Context<{
      points: { id: string; lat: number; lng: number }[];
    }>({
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
        const point = ref.value();
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
    const context = new Context<{
      departments: { id: number; name: string }[];
    }>({
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
    const context = new Context<{ items: string[] }>({
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
