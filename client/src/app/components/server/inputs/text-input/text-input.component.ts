import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import type { TextInputConfig } from '@shared/types/text-input-config';
import { textInputNativeAttrs } from '@shared/utils/text-input-native-attrs';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
import { ServerInputComponent } from '../server-input-component';

@Component({
  selector: 'app-text-input',
  imports: [PreparePipe],
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextInputComponent extends ServerInputComponent<
  TextInputConfig,
  string
> {
  private maskSlots: Set<string> | null = null;
  private maskPrev: number[] = [];
  private maskFirstSlotIndex: number | null = null;
  private maskAcceptRegexp: RegExp | null = null;
  private back = false;

  protected inputElement = viewChild<ElementRef<HTMLInputElement>>('input');

  get nativeAttrs() {
    return textInputNativeAttrs(this.config.properties.kind);
  }

  override default(): string {
    return '';
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.setupMask();
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (this.hasMask) {
      const el = this.inputElement()?.nativeElement;
      if (el) {
        this.formatMaskedValue(el);
      }
    }
  }

  private get hasMask(): boolean {
    return !!this.config.properties.mask;
  }

  // https://stackoverflow.com/questions/12578507/implement-an-input-with-a-mask
  private setupMask(): void {
    const mask = this.config.properties.mask;
    if (!mask) {
      return;
    }

    const slotsChars = mask.dataSymbols || '_';
    this.maskSlots = new Set(Array.from(slotsChars));

    const patternArray = Array.from(mask.value);
    let j = 0;
    this.maskPrev = patternArray.map((c, i) =>
      this.maskSlots!.has(c) ? (j = i + 1) : j,
    );
    this.maskFirstSlotIndex = patternArray.findIndex((c) =>
      this.maskSlots!.has(c),
    );
    this.maskAcceptRegexp = new RegExp(mask.accept || '\\d', 'g');
  }

  private clean(input: string): string[] {
    const mask = this.config.properties.mask;
    if (!mask || !this.maskSlots || !this.maskAcceptRegexp) {
      return Array.from(input);
    }

    const matchResult = input.match(this.maskAcceptRegexp);
    let matches: string[] = matchResult ? [...matchResult] : [];
    if (mask.size && mask.size > 0) {
      matches = matches.slice(0, mask.size);
    }

    const patternArray = Array.from(mask.value);
    const queue = [...matches];

    return patternArray.map((c) =>
      queue[0] === c || this.maskSlots!.has(c) ? queue.shift() || c : c,
    );
  }

  private formatMaskedValue(el: HTMLInputElement): void {
    const mask = this.config.properties.mask;
    if (
      !mask ||
      !this.maskSlots ||
      !this.maskPrev.length ||
      this.maskFirstSlotIndex === null
    ) {
      return;
    }

    const selectionStart = el.selectionStart ?? 0;
    const selectionEnd = el.selectionEnd ?? selectionStart;

    const calcPosition = (pos: number | null): number => {
      if (pos === null) {
        return this.maskPrev.at(-1) ?? 0;
      }

      const cleaned = this.clean(el.value.slice(0, pos));
      const index = cleaned.findIndex((c) => this.maskSlots!.has(c));

      if (index < 0) {
        return this.maskPrev.at(-1) ?? 0;
      }

      if (this.back) {
        return this.maskPrev[index - 1] ?? this.maskFirstSlotIndex!;
      }

      return index;
    };

    const i = calcPosition(selectionStart);
    const j = calcPosition(selectionEnd);

    el.value = this.clean(el.value).join('');
    el.setSelectionRange(i, j);
    this.back = false;
    this.value.set(el.value);
  }

  onFocusIn(): void {
    if (!this.hasMask) {
      return;
    }

    const el = this.inputElement()?.nativeElement;
    if (el) {
      this.formatMaskedValue(el);
    }
  }

  onFocusOut(): void {
    if (!this.hasMask) {
      return;
    }

    const el = this.inputElement()?.nativeElement;
    const mask = this.config.properties.mask;
    if (el && mask && el.value === mask.value) {
      el.value = '';
      this.value.set('');
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.hasMask) {
      return;
    }

    this.back = event.key === 'Backspace';
  }

  override onInputChange(event: Event): void {
    if (!this.hasMask) {
      super.onInputChange(event);
      return;
    }

    const target = event.target as HTMLInputElement;
    if (target instanceof HTMLInputElement) {
      this.formatMaskedValue(target);
    } else {
      super.onInputChange(event);
    }
  }
}
