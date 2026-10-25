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
import type { ActionConfig } from "../../core/actions/action";
import {
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
} from "../../core/actions/component-local-actions";
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
  readonly local = {
    insertHTML: (value: string, config?: ActionConfig) =>
      textEditorInsertHtmlLocal(this, value, config),
    toggleItalic: (config?: ActionConfig) =>
      textEditorToggleItalicLocal(this, config),
    toggleBold: (config?: ActionConfig) =>
      textEditorToggleBoldLocal(this, config),
    toggleUnderline: (config?: ActionConfig) =>
      textEditorToggleUnderlineLocal(this, config),
    undo: (config?: ActionConfig) => textEditorUndoLocal(this, config),
    redo: (config?: ActionConfig) => textEditorRedoLocal(this, config),
    superscript: (config?: ActionConfig) =>
      textEditorSuperscriptLocal(this, config),
    insertOrderedList: (config?: ActionConfig) =>
      textEditorInsertOrderedListLocal(this, config),
    insertUnorderedList: (config?: ActionConfig) =>
      textEditorInsertUnorderedListLocal(this, config),
    justifyLeft: (config?: ActionConfig) =>
      textEditorJustifyLeftLocal(this, config),
    justifyCenter: (config?: ActionConfig) =>
      textEditorJustifyCenterLocal(this, config),
    justifyRight: (config?: ActionConfig) =>
      textEditorJustifyRightLocal(this, config),
    justifyFull: (config?: ActionConfig) =>
      textEditorJustifyFullLocal(this, config),
    formatBlock: (tag: string, config?: ActionConfig) =>
      textEditorFormatBlockLocal(this, tag, config),
  };

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
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorInsertHtmlMessage(target, { ...payload, actionScope }),
    );
  }

  /**
   * Переключает курсивное начертание текста.
   */
  toggleItalic(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorToggleItalicMessage(target, { actionScope }),
    );
  }

  /**
   * Переключает полужирное начертание текста.
   */
  toggleBold(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorToggleBoldMessage(target, { actionScope }),
    );
  }

  /**
   * Переключает подчеркивание текста.
   */
  toggleUnderline(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorToggleUnderlineMessage(target, { actionScope }),
    );
  }

  /**
   * Выполняет операцию отмены последнего действия.
   */
  undo(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorUndoMessage(target, { actionScope }),
    );
  }

  /**
   * Выполняет операцию повтора последнего отмененного действия.
   */
  redo(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorRedoMessage(target, { actionScope }),
    );
  }

  /**
   * Применяет формат верхнего индекса к выделенному тексту.
   */
  superscript(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorSuperscriptMessage(target, { actionScope }),
    );
  }

  /**
   * Вставляет нумерованный список.
   */
  insertOrderedList(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorInsertOrderedListMessage(target, { actionScope }),
    );
  }

  /**
   * Вставляет маркированный список.
   */
  insertUnorderedList(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorInsertUnorderedListMessage(target, { actionScope }),
    );
  }

  /**
   * Выравнивает текст по левому краю.
   */
  justifyLeft(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorJustifyLeftMessage(target, { actionScope }),
    );
  }

  /**
   * Выравнивает текст по центру.
   */
  justifyCenter(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorJustifyCenterMessage(target, { actionScope }),
    );
  }

  /**
   * Выравнивает текст по правому краю.
   */
  justifyRight(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorJustifyRightMessage(target, { actionScope }),
    );
  }

  /**
   * Выравнивает текст по ширине.
   */
  justifyFull(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorJustifyFullMessage(target, { actionScope }),
    );
  }

  /**
   * Форматирует блок с указанным тегом.
   *
   * @param tag Тег HTML для форматирования блока.
   */
  formatBlock(tag: string, instances?: ComponentInstance[]) {
    const payload = { tag };
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) =>
        new TextEditorFormatBlockMessage(target, { ...payload, actionScope }),
    );
  }
}
