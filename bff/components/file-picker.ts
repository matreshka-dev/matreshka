import { ServerComponentClass } from "@matreshka/client-bff-protocol/enums/server-component-class";
import type { FilePickerFilePayload } from "@matreshka/client-bff-protocol/messages/client-to-bff/components/file-picker/file-picker-select-message";
import type { FilePickerConfig } from "@matreshka/client-bff-protocol/types/file-picker-config";
import { z } from "zod";
import {
  calculateComponents,
  Componentable,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  StandaloneComponent,
} from "../core";
import { currentClient } from "../core/client-context";
import { LocalFile } from "../platforms/local-file";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "./component";

/**
 * Свойства компонента выбора файла.
 */
export type FilePickerProperties = {
  multiple: boolean;
  content: ComponentTreeNode[];
  accept?: string;
} & ComponentProperties;

/**
 * Конфигурация инициализации компонента выбора файла.
 */
export type FilePickerInitConfig<
  ComponentType extends Componentable = FilePicker,
  PropertiesType extends FilePickerProperties = FilePickerProperties,
> = {
  multiple: boolean;
  content: MixedWithCallbacksArray<ComponentTreeNode>;
  accept?: string;
  onSelect?: (files: LocalFile[]) => void;
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = FilePickerInitConfig<FilePicker>;

export function filePicker(
  options: Omit<DefaultInitConfigType, "content">,
  content: DefaultInitConfigType["content"],
): FilePicker;
export function filePicker(config: DefaultInitConfigType): FilePicker;
export function filePicker(
  arg0: Omit<DefaultInitConfigType, "content"> | DefaultInitConfigType,
  arg1?: DefaultInitConfigType["content"],
): FilePicker {
  if (arg1 !== undefined) {
    return new FilePicker({
      ...(arg0 as Omit<DefaultInitConfigType, "content">),
      content: arg1,
    });
  }
  return new FilePicker(arg0 as DefaultInitConfigType);
}

const filePayloadSchema = z.strictObject({
  id: z.string(),
  type: z.string(),
  size: z.number(),
  name: z.string(),
  lastModified: z.number(),
  url: z.string().refine((val) => val.startsWith("blob:"), {
    message: "url must be a blob",
  }),
});

/**
 * Компонент выбора файлов (без авто-upload).
 */
export class FilePicker<
    InitConfigType extends FilePickerInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends FilePickerProperties = FilePickerProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: InitConfigType) {
    super(config);
    this.onInteraction<{ files: FilePickerFilePayload[] }>(
      "select",
      ({ payload }) => {
        const schema = z.strictObject({
          files: z.array(filePayloadSchema).min(1),
        });
        const safePayload = schema.parse(payload);
        const client = currentClient();
        const files = safePayload.files.map(
          (file) => new LocalFile(client, file),
        );
        this.config.onSelect?.(files);
      },
    );
  }

  standalone(): true {
    return true;
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.FilePicker;
  }

  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(initValues.content),
      accept: initValues.accept,
      multiple: initValues.multiple,
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    const out = super.serializeRuleOverrides(overrides);
    if (overrides.content !== undefined) {
      out.content = serializeComponentList(overrides.content);
    }
    return out;
  }

  serialize(): FilePickerConfig {
    const result = super.serialize();
    return {
      ...result,
      class: ServerComponentClass.FilePicker,
      properties: this.buildPropertiesForClient({
        content: serializeComponentList(this.properties.content),
      }),
    };
  }
}
