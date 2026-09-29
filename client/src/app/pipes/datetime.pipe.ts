import { Pipe, PipeTransform } from '@angular/core';
import type { DateTimeOutputOptions } from '@shared/types/datetime-output-config';

@Pipe({
  name: 'datetime',
  pure: true,
})
export class DatetimePipe implements PipeTransform {
  transform(
    value?: string | number,
    locales?: string[],
    options?: DateTimeOutputOptions,
  ): string {
    if (value) {
      const date = new Date(value);
      return date.toLocaleString(locales, options);
    }
    return '';
  }
}
