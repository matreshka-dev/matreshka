import { describe, expect, it } from "vitest";
import type { Componentable } from "../types/componentable";
import {
  boardZoomInLocal,
  boardZoomOutLocal,
  mapSetCenterLocal,
  mapSetZoomLocal,
  mapZoomInLocal,
  mapZoomOutLocal,
  scrollToLocal,
  textEditorFormatBlockLocal,
  textEditorInsertHtmlLocal,
  textEditorInsertOrderedListLocal,
  textEditorInsertUnorderedListLocal,
  textEditorJustifyCenterLocal,
  textEditorJustifyFullLocal,
  textEditorJustifyLeftLocal,
  textEditorJustifyRightLocal,
  textEditorRedoLocal,
  textEditorSuperscriptLocal,
  textEditorToggleBoldLocal,
  textEditorToggleItalicLocal,
  textEditorToggleUnderlineLocal,
  textEditorUndoLocal,
} from "./component-local-actions";
import { createInstanceLocalActions } from "./local-action";

const component = {
  id: "component-id",
  serialize: () => ({ id: "component-id", class: "unit-test" }),
} as unknown as Componentable;

describe("component local actions", () => {
  it("serializes component target and command payload", () => {
    expect(
      mapSetCenterLocal(component, {
        latitude: 55.75,
        longitude: 37.62,
        altitude: 120,
      }).toJSON(),
    ).toEqual({
      class: "component-local-map-set-center",
      payload: {
        target: "component-id",
        latitude: 55.75,
        longitude: 37.62,
        altitude: 120,
      },
    });

    expect(scrollToLocal(component, -16, true).toJSON()).toEqual({
      class: "component-local-stack-scroll-to",
      payload: { target: "component-id", value: -16, smooth: true },
    });

    expect(textEditorInsertHtmlLocal(component, "<b>x</b>").toJSON()).toEqual({
      class: "component-local-text-editor-insert-html",
      payload: { target: "component-id", value: "<b>x</b>" },
    });

    expect(textEditorFormatBlockLocal(component, "h2").toJSON()).toEqual({
      class: "component-local-text-editor-format-block",
      payload: { target: "component-id", tag: "h2" },
    });
  });

  it("serializes commands without extra payload", () => {
    const actions = [
      mapZoomInLocal(component),
      mapZoomOutLocal(component),
      boardZoomInLocal(component),
      boardZoomOutLocal(component),
      textEditorToggleItalicLocal(component),
      textEditorToggleBoldLocal(component),
      textEditorToggleUnderlineLocal(component),
      textEditorUndoLocal(component),
      textEditorRedoLocal(component),
      textEditorSuperscriptLocal(component),
      textEditorInsertOrderedListLocal(component),
      textEditorInsertUnorderedListLocal(component),
      textEditorJustifyLeftLocal(component),
      textEditorJustifyCenterLocal(component),
      textEditorJustifyRightLocal(component),
      textEditorJustifyFullLocal(component),
    ];

    expect(actions.map((action) => action.toJSON().payload)).toEqual(
      actions.map(() => ({ target: "component-id" })),
    );
    expect(new Set(actions.map((action) => action.toJSON().class)).size).toBe(
      actions.length,
    );
  });

  it("instance.local адресует действие только конкретным instance", () => {
    const instance = createInstanceLocalActions(
      { setZoom: (zoom: number) => mapSetZoomLocal(component, zoom) },
      "instance-id",
    );

    expect(instance.setZoom(9).toJSON()).toEqual({
      class: "component-local-map-set-zoom",
      payload: { target: "instance-id", zoom: 9 },
    });
  });
});
