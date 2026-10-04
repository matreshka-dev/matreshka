import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { TextEditorFormatBlockMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-format-block-message";
import { TextEditorInsertHtmlMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-insert-html-message";
import { TextEditorInsertOrderedListMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-insert-ordered-list-message";
import { TextEditorInsertUnorderedListMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-insert-unordered-list-message";
import { TextEditorJustifyCenterMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-justify-center-message";
import { TextEditorJustifyFullMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-justify-full-message";
import { TextEditorJustifyLeftMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-justify-left-message";
import { TextEditorJustifyRightMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-justify-right-message";
import { TextEditorRedoMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-redo-message";
import { TextEditorSuperscriptMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-superscript-message";
import { TextEditorToggleBoldMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-toggle-bold-message";
import { TextEditorToggleItalicMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-toggle-italic-message";
import { TextEditorToggleUnderlineMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-toggle-underline-message";
import { TextEditorUndoMessage } from "@matreshka/shared/messages/bff-to-client/components/text-editor/text-editor-undo-message";
import { Componentable, ComponentInstance, ContextRef } from "../../core";
import { ServerComponentAction } from "../component";
import {
  InputComponent,
  InputInitConfig,
  InputProperties,
  StringInputContextRef,
} from "./input-component";

/**
 * Свойства компонента текстового редактора.
 */
export type TextEditorProperties = InputProperties;

/**
 * Конфигурация инициализации текстового редактора.
 */
export type TextEditorInitConfig<
  ComponentType extends Componentable = TextEditor,
  RefType extends StringInputContextRef = StringInputContextRef,
  PropertiesType extends TextEditorProperties = TextEditorProperties,
> = InputInitConfig<string, ComponentType, RefType, PropertiesType> & {
  /**
   * Событие: изменился выделенный текст в редакторе.
   */
  onSelectionChange?:
    | ServerComponentAction<ComponentType, string>
    | ServerComponentAction<ComponentType, string>[];
};

type DefaultInitConfigType<RefType extends StringInputContextRef> =
  TextEditorInitConfig<TextEditor, RefType>;

export function textEditor<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "ref">,
  ref: DefaultInitConfigType<RefType>["ref"],
): TextEditor<RefType>;
export function textEditor<
  RefType extends StringInputContextRef = StringInputContextRef,
>(ref: DefaultInitConfigType<RefType>["ref"]): TextEditor<RefType>;
export function textEditor<
  RefType extends StringInputContextRef = StringInputContextRef,
>(config: TextEditorInitConfig<any, RefType>): TextEditor<RefType>;
export function textEditor<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  arg0:
    | DefaultInitConfigType<RefType>["ref"]
    | Omit<DefaultInitConfigType<RefType>, "ref">
    | TextEditorInitConfig<any, RefType>,
  arg1?: DefaultInitConfigType<RefType>["ref"],
): TextEditor<RefType> {
  if (arg1 !== undefined) {
    return new TextEditor<RefType>({
      ...(arg0 as Omit<DefaultInitConfigType<RefType>, "ref">),
      ref: arg1,
    });
  }
  const single = arg0;
  if (single instanceof ContextRef) {
    return new TextEditor<RefType>({ ref: single });
  }
  return new TextEditor<RefType>(single as TextEditorInitConfig<any, RefType>);
}

/**
 * Компонент визуального текстового редактора.
 *
 * Поддерживает панель инструментов, вложенные компоненты и команды форматирования.
 */
export class TextEditor<
  RefType extends StringInputContextRef = StringInputContextRef,
  InitConfigType extends TextEditorInitConfig<
    any,
    RefType
  > = DefaultInitConfigType<RefType>,
  PropertiesType extends TextEditorProperties = TextEditorProperties,
> extends InputComponent<InitConfigType, PropertiesType> {
  constructor(config: TextEditorInitConfig<any, RefType>);
  constructor(config: InitConfigType) {
    super(config);
    if (config.onSelectionChange) {
      const actions = config.onSelectionChange as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("selection-change", actions);
    }
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.TextEditor;
  }

  /**
   * Вставляет HTML в редактор.
   *
   * @param value Строка HTML.
   */
  insertHTML(value: string, instances?: ComponentInstance[]) {
    const payload = { value };
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorInsertHtmlMessage(instance.id, payload),
          );
        });
    } else {
      this.broadcast(new TextEditorInsertHtmlMessage(this.id, payload));
    }
    return this;
  }

  /**
   * Переключает курсивное начертание текста.
   */
  toggleItalic(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorToggleItalicMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorToggleItalicMessage(this.id));
    }
    return this;
  }

  /**
   * Переключает полужирное начертание текста.
   */
  toggleBold(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorToggleBoldMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorToggleBoldMessage(this.id));
    }
    return this;
  }

  /**
   * Переключает подчеркивание текста.
   */
  toggleUnderline(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorToggleUnderlineMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorToggleUnderlineMessage(this.id));
    }
    return this;
  }

  /**
   * Выполняет операцию отмены последнего действия.
   */
  undo(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorUndoMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorUndoMessage(this.id));
    }
    return this;
  }

  /**
   * Выполняет операцию повтора последнего отмененного действия.
   */
  redo(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorRedoMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorRedoMessage(this.id));
    }
    return this;
  }

  /**
   * Применяет формат верхнего индекса к выделенному тексту.
   */
  superscript(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorSuperscriptMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorSuperscriptMessage(this.id));
    }
    return this;
  }

  /**
   * Вставляет нумерованный список.
   */
  insertOrderedList(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorInsertOrderedListMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorInsertOrderedListMessage(this.id));
    }
    return this;
  }

  /**
   * Вставляет маркированный список.
   */
  insertUnorderedList(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorInsertUnorderedListMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorInsertUnorderedListMessage(this.id));
    }
    return this;
  }

  /**
   * Выравнивает текст по левому краю.
   */
  justifyLeft(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorJustifyLeftMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorJustifyLeftMessage(this.id));
    }
    return this;
  }

  /**
   * Выравнивает текст по центру.
   */
  justifyCenter(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorJustifyCenterMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorJustifyCenterMessage(this.id));
    }
    return this;
  }

  /**
   * Выравнивает текст по правому краю.
   */
  justifyRight(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorJustifyRightMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorJustifyRightMessage(this.id));
    }
    return this;
  }

  /**
   * Выравнивает текст по ширине.
   */
  justifyFull(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorJustifyFullMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new TextEditorJustifyFullMessage(this.id));
    }
    return this;
  }

  /**
   * Форматирует блок с указанным тегом.
   *
   * @param tag Тег HTML для форматирования блока.
   */
  formatBlock(tag: string, instances?: ComponentInstance[]) {
    const payload = { tag };
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new TextEditorFormatBlockMessage(instance.id, payload),
          );
        });
    } else {
      this.broadcast(new TextEditorFormatBlockMessage(this.id, payload));
    }
    return this;
  }
}
