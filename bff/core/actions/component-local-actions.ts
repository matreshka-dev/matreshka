import { ScrollToPosition } from "@matreshka/shared/enums/scroll-to-position";
import type { BoardPoint } from "@matreshka/shared/types/board-config";
import type { VideoInputDevice } from "../../platforms/platform";
import type { Componentable } from "../types/componentable";
import type { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

abstract class ComponentLocalAction extends LocalAction {
  constructor(
    protected readonly component: Componentable,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  protected targetPayload(): { target: string } {
    return { target: this.component.id };
  }
}

export class MapSetCenterLocalAction extends ComponentLocalAction {
  constructor(
    component: Componentable,
    private readonly center: {
      latitude: number;
      longitude: number;
      altitude?: number;
    },
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-map-set-center";
  }

  payload(): object {
    return { ...this.targetPayload(), ...this.center };
  }
}

export function mapSetCenterLocal(
  component: Componentable,
  center: {
    latitude: number;
    longitude: number;
    altitude?: number;
  },
  config?: ActionConfig,
): MapSetCenterLocalAction {
  return new MapSetCenterLocalAction(component, center, config);
}

export class MapSetZoomLocalAction extends ComponentLocalAction {
  constructor(
    component: Componentable,
    private readonly zoom: number,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-map-set-zoom";
  }

  payload(): object {
    return { ...this.targetPayload(), zoom: this.zoom };
  }
}

export function mapSetZoomLocal(
  component: Componentable,
  zoom: number,
  config?: ActionConfig,
): MapSetZoomLocalAction {
  return new MapSetZoomLocalAction(component, zoom, config);
}

export class MapZoomInLocalAction extends ComponentLocalAction {
  class(): string {
    return "component-local-map-zoom-in";
  }

  payload(): object {
    return this.targetPayload();
  }
}

export function mapZoomInLocal(
  component: Componentable,
  config?: ActionConfig,
): MapZoomInLocalAction {
  return new MapZoomInLocalAction(component, config);
}

export class MapZoomOutLocalAction extends ComponentLocalAction {
  class(): string {
    return "component-local-map-zoom-out";
  }

  payload(): object {
    return this.targetPayload();
  }
}

export function mapZoomOutLocal(
  component: Componentable,
  config?: ActionConfig,
): MapZoomOutLocalAction {
  return new MapZoomOutLocalAction(component, config);
}

export class BoardSetCenterLocalAction extends ComponentLocalAction {
  constructor(
    component: Componentable,
    private readonly center: BoardPoint,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-board-set-center";
  }

  payload(): object {
    return { ...this.targetPayload(), ...this.center };
  }
}

export function boardSetCenterLocal(
  component: Componentable,
  center: BoardPoint,
  config?: ActionConfig,
): BoardSetCenterLocalAction {
  return new BoardSetCenterLocalAction(component, center, config);
}

export class BoardSetZoomLocalAction extends ComponentLocalAction {
  constructor(
    component: Componentable,
    private readonly zoom: number,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-board-set-zoom";
  }

  payload(): object {
    return { ...this.targetPayload(), zoom: this.zoom };
  }
}

export function boardSetZoomLocal(
  component: Componentable,
  zoom: number,
  config?: ActionConfig,
): BoardSetZoomLocalAction {
  return new BoardSetZoomLocalAction(component, zoom, config);
}

export class BoardZoomInLocalAction extends ComponentLocalAction {
  class(): string {
    return "component-local-board-zoom-in";
  }

  payload(): object {
    return this.targetPayload();
  }
}

export function boardZoomInLocal(
  component: Componentable,
  config?: ActionConfig,
): BoardZoomInLocalAction {
  return new BoardZoomInLocalAction(component, config);
}

export class BoardZoomOutLocalAction extends ComponentLocalAction {
  class(): string {
    return "component-local-board-zoom-out";
  }

  payload(): object {
    return this.targetPayload();
  }
}

export function boardZoomOutLocal(
  component: Componentable,
  config?: ActionConfig,
): BoardZoomOutLocalAction {
  return new BoardZoomOutLocalAction(component, config);
}

export class ScrollToLocalAction extends ComponentLocalAction {
  constructor(
    component: Componentable,
    private readonly value: number | ScrollToPosition,
    private readonly smooth: boolean,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-stack-scroll-to";
  }

  payload(): object {
    return {
      ...this.targetPayload(),
      value: this.value,
      smooth: this.smooth,
    };
  }
}

export function scrollToLocal(
  component: Componentable,
  value: number | ScrollToPosition,
  smooth = false,
  config?: ActionConfig,
): ScrollToLocalAction {
  return new ScrollToLocalAction(component, value, smooth, config);
}

export class CameraSwitchLocalAction extends ComponentLocalAction {
  constructor(
    component: Componentable,
    private readonly device: VideoInputDevice,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-camera-switch";
  }

  payload(): object {
    return {
      ...this.targetPayload(),
      deviceId: this.device.deviceId,
    };
  }
}

export function cameraSwitchLocal(
  component: Componentable,
  device: VideoInputDevice,
  config?: ActionConfig,
): CameraSwitchLocalAction {
  return new CameraSwitchLocalAction(component, device, config);
}

abstract class TextEditorLocalAction extends ComponentLocalAction {}

class TextEditorCommandLocalAction extends TextEditorLocalAction {
  constructor(
    component: Componentable,
    private readonly command: string,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return `component-local-text-editor-${this.command}`;
  }

  payload(): object {
    return this.targetPayload();
  }
}

function textEditorCommandLocal(
  component: Componentable,
  command: string,
  config?: ActionConfig,
): TextEditorCommandLocalAction {
  return new TextEditorCommandLocalAction(component, command, config);
}

export class TextEditorInsertHtmlLocalAction extends TextEditorLocalAction {
  constructor(
    component: Componentable,
    private readonly value: string,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-text-editor-insert-html";
  }

  payload(): object {
    return { ...this.targetPayload(), value: this.value };
  }
}

export function textEditorInsertHtmlLocal(
  component: Componentable,
  value: string,
  config?: ActionConfig,
): TextEditorInsertHtmlLocalAction {
  return new TextEditorInsertHtmlLocalAction(component, value, config);
}

export class TextEditorFormatBlockLocalAction extends TextEditorLocalAction {
  constructor(
    component: Componentable,
    private readonly tag: string,
    config?: ActionConfig,
  ) {
    super(component, config);
  }

  class(): string {
    return "component-local-text-editor-format-block";
  }

  payload(): object {
    return { ...this.targetPayload(), tag: this.tag };
  }
}

export function textEditorFormatBlockLocal(
  component: Componentable,
  tag: string,
  config?: ActionConfig,
): TextEditorFormatBlockLocalAction {
  return new TextEditorFormatBlockLocalAction(component, tag, config);
}

export function textEditorToggleItalicLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "toggle-italic", config);
}

export function textEditorToggleBoldLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "toggle-bold", config);
}

export function textEditorToggleUnderlineLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "toggle-underline", config);
}

export function textEditorUndoLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "undo", config);
}

export function textEditorRedoLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "redo", config);
}

export function textEditorSuperscriptLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "superscript", config);
}

export function textEditorInsertOrderedListLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "insert-ordered-list", config);
}

export function textEditorInsertUnorderedListLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "insert-unordered-list", config);
}

export function textEditorJustifyLeftLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "justify-left", config);
}

export function textEditorJustifyCenterLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "justify-center", config);
}

export function textEditorJustifyRightLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "justify-right", config);
}

export function textEditorJustifyFullLocal(
  component: Componentable,
  config?: ActionConfig,
): LocalAction {
  return textEditorCommandLocal(component, "justify-full", config);
}
