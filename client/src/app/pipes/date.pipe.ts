import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'date',
  pure: true,
})
export class DatePipe implements PipeTransform {
  transform(value?: string | number): string {
    if (value) {
      const date = new Date(value);
      return date.toLocaleDateString();
    }
    return '';
  }
}
