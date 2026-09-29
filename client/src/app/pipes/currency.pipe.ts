import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currency',
  pure: true,
})
export class CurrencyPipe implements PipeTransform {
  transform(
    value: number | undefined,
    currency: string,
    minIntegerDigits?: number,
    minFractionDigits?: number,
    maxFractionDigits?: number,
  ): string {
    if (typeof value === 'undefined') {
      return '';
    }
    const formatter = new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currency,
      minimumIntegerDigits: minIntegerDigits,
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    });
    return value !== undefined ? formatter.format(value) : '';
  }
}
