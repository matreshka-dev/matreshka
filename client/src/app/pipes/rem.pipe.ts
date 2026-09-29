import { Pipe, PipeTransform } from '@angular/core';
import { rem } from '../utils/rem';

@Pipe({
  name: 'rem',
  pure: true,
})
export class RemPipe implements PipeTransform {
  transform(value: number | undefined): string | undefined {
    return rem(value);
  }
}
