import { Directive, ElementRef, output } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutsideDirective {
  clickOutside = output();
  constructor(private elementRef: ElementRef) {}

  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.clickOutside.emit();
    }
  }
}
