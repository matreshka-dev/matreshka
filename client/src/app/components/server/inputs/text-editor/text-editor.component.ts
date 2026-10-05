import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { TextEditorConfig } from '@shared/types/text-editor-config';
import { ServerInputComponent } from '../server-input-component';

import { WINDOW } from '../../../../tokens/window';

import { TextEditorFormatBlockMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-format-block-message';
import { TextEditorInsertHtmlMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-insert-html-message';
import { TextEditorInsertOrderedListMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-insert-ordered-list-message';
import { TextEditorInsertUnorderedListMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-insert-unordered-list-message';
import { TextEditorJustifyCenterMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-justify-center-message';
import { TextEditorJustifyFullMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-justify-full-message';
import { TextEditorJustifyLeftMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-justify-left-message';
import { TextEditorJustifyRightMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-justify-right-message';
import { TextEditorRedoMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-redo-message';
import { TextEditorSuperscriptMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-superscript-message';
import { TextEditorToggleBoldMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-toggle-bold-message';
import { TextEditorToggleItalicMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-toggle-italic-message';
import { TextEditorToggleUnderlineMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-toggle-underline-message';
import { TextEditorUndoMessage } from '@shared/messages/bff-to-client/components/text-editor/text-editor-undo-message';
import { TextEditorSelectionChangeMessage } from '@shared/messages/client-to-bff/components/text-editor/text-editor-selection-change-message';

@Component({
  selector: 'app-text-editor',
  imports: [],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'text-editor',
  },
})
export class TextEditorComponent
  extends ServerInputComponent<TextEditorConfig, string>
  implements OnInit, OnDestroy
{
  private lastSelection = '';
  window = inject(WINDOW);
  codeValue = '';
  input = viewChild<ElementRef<HTMLDivElement>>('input');
  savedSelection: any;
  focused = signal(false);
  selectionChangeHandler = () => {
    this.selectionChange();
  };
  inputValue = signal('');

  /**
   * В angular есть баг https://github.com/angular/angular/issues/9796, div contenteditable не поддерживает ngModel,
   * поэтому приходится использовать [innerHTML] + (input), но при таком подходе при каждом изменении значения innerHTML
   * сбрасывается курсор, поэтому используется два значения, одно для отображения, которое обновляется только в опред случаях
   * и codeValue, которое обновляется при изменении содержания
   */
  override default(): string {
    return '';
  }

  constructor() {
    super();
    effect(() => {
      const currentValue = this.value();
      if (currentValue !== this.codeValue) {
        this.codeValue = currentValue;
        this.inputValue.set(currentValue);
      }
    });
  }

  override ngOnInit() {
    super.ngOnInit();
    this.document.addEventListener(
      'selectionchange',
      this.selectionChangeHandler,
    );
    // this.inputValue.set(this.value());
    // this.codeValue = this.value();
    // let prevValue = this.value();
    // this.contextHub.change$
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(() => {
    //     if (JSON.stringify(prevValue) !== JSON.stringify(this.value())) {
    //       prevValue = this.value();
    //       // Обработчик на случай если ключ контекста поменялся вне редактора и нужно обновить текстовую область
    //       // Сохраняем позицию курсора (в символах) и восстанавливаем после замены содержимого
    //       // const inputEl = this.input()?.nativeElement;
    //       // const wasFocused = this.focused();
    //       // const savedOffsets =
    //       //   wasFocused && inputEl
    //       //     ? this.getSelectionCharacterOffsetsWithin(inputEl)
    //       //     : null;

    //       // console.log('savedOffsets', savedOffsets);

    //       this.inputValue.set(this.value());
    //       this.codeValue = this.value();

    //       // if (savedOffsets && inputEl) {
    //       //   this.window.requestAnimationFrame(() => {
    //       //     if (wasFocused) {
    //       //       this.focusInput();
    //       //     }
    //       //     this.setSelectionCharacterOffsetsWithin(
    //       //       inputEl,
    //       //       savedOffsets.start,
    //       //       savedOffsets.end
    //       //     );
    //       //   });
    //       // }
    //     }
    //   });
    this.componentCommandMessages$.subscribe((message) => {
      if (message instanceof TextEditorInsertHtmlMessage) {
        this.focusInput();
        this.document.execCommand('insertHTML', false, message.payload.value);
      } else if (message instanceof TextEditorToggleItalicMessage) {
        this.focusInput();
        this.document.execCommand('italic', false);
      } else if (message instanceof TextEditorToggleBoldMessage) {
        this.focusInput();
        this.document.execCommand('bold', false);
      } else if (message instanceof TextEditorToggleUnderlineMessage) {
        this.focusInput();
        this.document.execCommand('underline', false);
      } else if (message instanceof TextEditorUndoMessage) {
        this.focusInput();
        this.document.execCommand('undo', false);
      } else if (message instanceof TextEditorRedoMessage) {
        this.focusInput();
        this.document.execCommand('redo', false);
      } else if (message instanceof TextEditorSuperscriptMessage) {
        this.focusInput();
        this.document.execCommand('superscript', false);
      } else if (message instanceof TextEditorInsertOrderedListMessage) {
        this.focusInput();
        this.document.execCommand('insertOrderedList', false);
      } else if (message instanceof TextEditorInsertUnorderedListMessage) {
        this.focusInput();
        this.document.execCommand('insertUnorderedList', false);
      } else if (message instanceof TextEditorJustifyLeftMessage) {
        this.focusInput();
        this.document.execCommand('justifyLeft', false);
      } else if (message instanceof TextEditorJustifyCenterMessage) {
        this.focusInput();
        this.document.execCommand('justifyCenter', false);
      } else if (message instanceof TextEditorJustifyRightMessage) {
        this.focusInput();
        this.document.execCommand('justifyRight', false);
      } else if (message instanceof TextEditorJustifyFullMessage) {
        this.focusInput();
        this.document.execCommand('justifyFull', false);
      } else if (message instanceof TextEditorFormatBlockMessage) {
        this.focusInput();
        this.document.execCommand('formatBlock', false, message.payload.tag);
      }
    });
  }

  focusInput() {
    this.input()?.nativeElement.focus();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.document.removeEventListener(
      'selectionchange',
      this.selectionChangeHandler,
    );
  }

  selectionChange(): void {
    const newSelection = this.document.getSelection()?.toString() ?? '';
    if (this.focused() && newSelection !== this.lastSelection) {
      this.lastSelection = newSelection;
      this.interact(
        'selection-change',
        this.componentInteractionMessage(
          (target) =>
            new TextEditorSelectionChangeMessage(target, newSelection),
        ),
      );
    }
  }

  paste(event: any) {
    event.preventDefault();
    // Очистка от метаданных, в частности Word'a
    this.document.execCommand(
      'insertHTML',
      false,
      event.clipboardData.getData('text/plain'),
    );
  }

  changeInput(event: any) {
    this.codeValue = event.target.innerHTML;
    this.value.set(this.codeValue);
  }

  // saveSelection() {
  //   const selection = this.window.getSelection()!;
  //   this.savedSelection = [
  //     selection.anchorNode,
  //     selection.anchorOffset,
  //     selection.focusNode,
  //     selection.focusOffset,
  //   ];
  // }

  // restoreSelection() {
  //   const selection = this.window.getSelection()!;
  //   if (this.savedSelection) {
  //     selection.setBaseAndExtent(
  //       this.savedSelection[0],
  //       this.savedSelection[1],
  //       this.savedSelection[2],
  //       this.savedSelection[3]
  //     );
  //   }
  // }

  // Вычисляет символьные смещения текущего выделения внутри root. Возвращает null, если выделение вне root
  // private getSelectionCharacterOffsetsWithin(
  //   root: HTMLElement
  // ): { start: number; end: number } | null {
  //   const selection = this.window.getSelection();
  //   if (!selection || selection.rangeCount === 0) {
  //     return null;
  //   }
  //   const range = selection.getRangeAt(0);
  //   if (
  //     !root.contains(range.startContainer) ||
  //     !root.contains(range.endContainer)
  //   ) {
  //     return null;
  //   }
  //   const preSelectionStart = this.document.createRange();
  //   preSelectionStart.selectNodeContents(root);
  //   preSelectionStart.setEnd(range.startContainer, range.startOffset);
  //   const start = preSelectionStart.toString().length;

  //   const preSelectionEnd = this.document.createRange();
  //   preSelectionEnd.selectNodeContents(root);
  //   preSelectionEnd.setEnd(range.endContainer, range.endOffset);
  //   const end = preSelectionEnd.toString().length;

  //   return { start, end };
  // }

  // // Устанавливает выделение по символьным смещениям внутри root
  // private setSelectionCharacterOffsetsWithin(
  //   root: HTMLElement,
  //   start: number,
  //   end: number
  // ): void {
  //   const range = this.document.createRange();
  //   const selection = this.window.getSelection();
  //   if (!selection) {
  //     return;
  //   }

  //   const resolvePosition = (index: number): { node: Node; offset: number } => {
  //     // Перебираем текстовые узлы и находим целевой
  //     const walker = this.document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  //     let currentIndex = 0;
  //     let lastTextNode: Text | null = null;
  //     while (walker.nextNode()) {
  //       const textNode = walker.currentNode as Text;
  //       const nodeLength = textNode.nodeValue ? textNode.nodeValue.length : 0;
  //       if (currentIndex + nodeLength >= index) {
  //         return { node: textNode, offset: index - currentIndex };
  //       }
  //       currentIndex += nodeLength;
  //       lastTextNode = textNode;
  //     }
  //     // Если текстовых узлов нет или индекс за пределами — ставим в конец
  //     if (lastTextNode) {
  //       const len = lastTextNode.nodeValue ? lastTextNode.nodeValue.length : 0;
  //       return { node: lastTextNode, offset: len };
  //     }
  //     return { node: root, offset: root.childNodes.length };
  //   };

  //   const startPos = resolvePosition(start);
  //   const endPos = resolvePosition(end);

  //   try {
  //     range.setStart(startPos.node, startPos.offset);
  //     range.setEnd(endPos.node, endPos.offset);
  //     selection.removeAllRanges();
  //     selection.addRange(range);
  //   } catch {
  //     // На случай редких несоответствий DOM после обновлений
  //   }
  // }
}
