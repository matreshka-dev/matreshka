import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import type { FileUploadAreaConfig } from "@matreshka/shared/types/file-upload-area-config";
import { z } from "zod/v4";
import {
  calculateComponents,
  Componentable,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  StandaloneComponent,
} from "../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "./component";

/**
 * Свойства компонента загрузки файла.
 *
 * @property upload Конфигурация загрузки.
 * @property multiple Можно ли загружать несколько файлов.
 * @property label Метка для поля загрузки.
 * @property url Ссылка для загрузки файлов (POST запрос).
 * @property accept MIME типы файлов, а также расширения файлов, которые можно загружать.
 */
export type FileUploadAreaProperties = {
  multiple: boolean;
  content: ComponentTreeNode[];
  url: string;
  accept?: string;
} & ComponentProperties;

/**
 * Конфигурация инициализации компонента загрузки файла.
 *
 * @property upload Настройки загрузки
 */
export type FileUploadAreaInitConfig<
  ComponentType extends Componentable = FileUploadArea,
  PropertiesType extends FileUploadAreaProperties = FileUploadAreaProperties,
> = {
  multiple: boolean;
  content: MixedWithCallbacksArray<ComponentTreeNode>;
  url: string;
  errorKey?: string;
  accept?: string;
  onStart?: (file: FileInfo) => void;
  onComplete?: (config: { file: FileInfo; response: unknown }) => void;
  onError?: (config: {
    file: FileInfo;
    response: unknown;
    code: number;
  }) => void;
  onProgress?: (config: { file: FileInfo; progress: number }) => void;
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = FileUploadAreaInitConfig<FileUploadArea>;

export function fileUploadArea(
  options: Omit<DefaultInitConfigType, "content">,
  content: DefaultInitConfigType["content"],
): FileUploadArea;
export function fileUploadArea(config: DefaultInitConfigType): FileUploadArea;
export function fileUploadArea(
  arg0: Omit<DefaultInitConfigType, "content"> | DefaultInitConfigType,
  arg1?: DefaultInitConfigType["content"],
): FileUploadArea {
  if (arg1 !== undefined) {
    return new FileUploadArea({
      ...(arg0 as Omit<DefaultInitConfigType, "content">),
      content: arg1,
    });
  }
  return new FileUploadArea(arg0 as DefaultInitConfigType);
}

export type FileInfo = {
  // Информация о загружаемом файле
  id: string; // Случайный идентификатор
  type: string; // Mime тип
  size: number; // Размер в байтах
  name: string; // Имя файла
  lastModified: number; // Время последней модификации в формате Unix timestamp
  url: string; // Ссылка на BLOB файл
};

/**
 * Компонент загрузки файлов.
 */
export class FileUploadArea<
    InitConfigType extends
      FileUploadAreaInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends FileUploadAreaProperties = FileUploadAreaProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  private uploadMap = new Map<string, FileInfo>();
  constructor(config: InitConfigType) {
    super(config);
    this.onInteraction<FileInfo>("start", ({ payload }) => {
      const schema = z.strictObject({
        id: z.string(),
        type: z.string(),
        size: z.number(),
        name: z.string(),
        lastModified: z.number(),
        url: z.string().refine((val) => val.startsWith("blob:"), {
          message: "url must be a blob",
        }),
      });
      const safePayload = schema.parse(payload);
      this.uploadMap.set(safePayload.id, safePayload);
      this.config.onStart?.(safePayload);
    });
    this.onInteraction<{ id: string; progress: number }>(
      "progress",
      ({ payload }) => {
        const schema = z
          .strictObject({
            id: z.string(),
            progress: z.number().min(0).max(100),
          })
          .refine((data) => this.uploadMap.has(data.id), {
            message: "Unknown upload id",
            path: ["id"],
          });
        const safePayload = schema.parse(payload);
        this.config.onProgress?.({
          file: this.uploadMap.get(safePayload.id)!,
          progress: safePayload.progress,
        });
      },
    );
    this.onInteraction<{ id: string; response: unknown }>(
      "complete",
      ({ payload }) => {
        const schema = z
          .strictObject({
            id: z.string(),
            response: z.unknown(),
          })
          .refine((data) => this.uploadMap.has(data.id), {
            message: "Unknown upload id",
            path: ["id"],
          });
        const safePayload = schema.parse(payload);
        this.config.onComplete?.({
          file: this.uploadMap.get(safePayload.id)!,
          response: safePayload.response,
        });
      },
    );
    this.onInteraction<{ id: string; response: unknown; code: number }>(
      "error",
      ({ payload }) => {
        const schema = z
          .strictObject({
            id: z.string(),
            response: z.unknown(),
            code: z.number(), // Не StatusCode, потому что может быть 0, который не содержится в словаре
          })
          .refine((data) => this.uploadMap.has(data.id), {
            message: "Unknown upload id",
            path: ["id"],
          });
        const safePayload = schema.parse(payload);
        this.config.onError?.({
          file: this.uploadMap.get(safePayload.id)!,
          response: safePayload.response,
          code: safePayload.code,
        });
        this.uploadMap.delete(safePayload.id);
      },
    );
  }

  standalone(): true {
    return true;
  }

  /**
   * Возвращает уникальный идентификатор класса компонента.
   * @returns Строка "file-upload-area".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.FileUploadArea;
  }

  /**
   * Инициализирует свойства компонента загрузки.
   *
   * @param initValues Конфигурация инициализации компонента.
   * @returns Объект свойств компонента.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(initValues.content),
      url: initValues.url,
      accept: initValues.accept,
      multiple: initValues.multiple,
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    return {
      ...overrides,
      content: overrides.content
        ? serializeComponentList(overrides.content)
        : undefined,
    };
  }

  serialize(): FileUploadAreaConfig {
    const result = super.serialize();
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.FileUploadArea,
      properties: {
        ...p,
        content: serializeComponentList(p.content),
      },
    };
  }
}
